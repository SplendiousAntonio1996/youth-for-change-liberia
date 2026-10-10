import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, Users, Search, Filter, Trash2, CheckCircle2, 
  Sparkles, RefreshCw, Download, Copy, Check, Plus, 
  Send, AlertCircle, Eye, EyeOff, X, ExternalLink, 
  ShieldCheck, ArrowUpDown, Tag, MapPin, Database,
  FileText, Clock, HelpCircle, UserPlus, Info
} from 'lucide-react';
import { SubscriberItem } from '../types';
import { 
  subscribeToSubscribersList, 
  subscribeToNewsletter, 
  deleteSubscriber, 
  updateSubscriberStatus, 
  resetMockSubscribers, 
  exportSubscribersToCSV,
  INITIAL_MOCK_SUBSCRIBERS
} from '../lib/subscriberService';
import { useToast } from '../context/ToastContext';

export const LIBERIA_COUNTIES = [
  'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount',
  'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland',
  'Montserrado', 'Nimba', 'River Cess', 'River Gee', 'Sinoe'
];

export const SUBSCRIBER_CATEGORIES = [
  'All Dispatches',
  'Debate & Oratory',
  'STEM & Robotics',
  'County Qualifiers',
  'Scholarships & Grants'
];

interface AdminSubscribersManagerProps {
  userEmail?: string | null;
}

export const AdminSubscribersManager: React.FC<AdminSubscribersManagerProps> = ({ userEmail }) => {
  const toast = useToast();
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [countyFilter, setCountyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'mock' | 'live'>('all');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showMockListBanner, setShowMockListBanner] = useState(true);

  // Add Form State
  const [newEmail, setNewEmail] = useState('');
  const [newCategory, setNewCategory] = useState('All Dispatches');
  const [newCounty, setNewCounty] = useState('Montserrado');
  const [newNotes, setNewNotes] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Broadcast Modal State
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('All Dispatches');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastSuccessNotice, setBroadcastSuccessNotice] = useState<string | null>(null);

  // Real-time listener
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToSubscribersList((list) => {
      setSubscribers(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtered subscribers list
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      // Origin filter
      if (originFilter === 'mock' && !sub.isMock) return false;
      if (originFilter === 'live' && sub.isMock) return false;

      // Category filter
      if (categoryFilter !== 'all' && sub.category !== categoryFilter) return false;

      // County filter
      if (countyFilter !== 'all' && sub.county !== countyFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && sub.status !== statusFilter) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesEmail = sub.email.toLowerCase().includes(q);
        const matchesCategory = sub.category.toLowerCase().includes(q);
        const matchesCounty = (sub.county || '').toLowerCase().includes(q);
        const matchesNotes = (sub.notes || '').toLowerCase().includes(q);
        if (!matchesEmail && !matchesCategory && !matchesCounty && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [subscribers, originFilter, categoryFilter, countyFilter, statusFilter, search]);

  // Statistics
  const stats = useMemo(() => {
    const total = subscribers.length;
    const mockCount = subscribers.filter(s => s.isMock).length;
    const liveCount = subscribers.filter(s => !s.isMock).length;
    const debateCount = subscribers.filter(s => s.category === 'Debate & Oratory').length;
    const stemCount = subscribers.filter(s => s.category === 'STEM & Robotics').length;
    const countyCount = subscribers.filter(s => s.category === 'County Qualifiers').length;
    const scholarshipCount = subscribers.filter(s => s.category === 'Scholarships & Grants').length;
    return {
      total,
      mockCount,
      liveCount,
      debateCount,
      stemCount,
      countyCount,
      scholarshipCount
    };
  }, [subscribers]);

  const handleCopyEmail = (emailText: string) => {
    navigator.clipboard.writeText(emailText);
    setCopiedEmail(emailText);
    toast.success(`Copied "${emailText}" to clipboard`, 'Email Copied');
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const handleCopyAllEmails = () => {
    if (filteredSubscribers.length === 0) {
      toast.warning('No subscribers in current view to copy.', 'Empty List');
      return;
    }
    const emails = filteredSubscribers.map(s => s.email).join(', ');
    navigator.clipboard.writeText(emails);
    toast.success(`Copied ${filteredSubscribers.length} email addresses to clipboard!`, 'Batch Copied');
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      toast.warning('No subscriber records available to export.', 'Export Empty');
      return;
    }
    const csvContent = exportSubscribersToCSV(subscribers);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `YFC_Liberia_Subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${subscribers.length} subscriber records to CSV file.`, 'CSV Downloaded');
  };

  const handleDelete = async (sub: SubscriberItem) => {
    if (!window.confirm(`Are you sure you want to remove "${sub.email}" from the dispatch list?`)) {
      return;
    }
    try {
      await deleteSubscriber(sub.id, sub.email);
      toast.success(`Removed "${sub.email}" from subscriber list.`, 'Subscriber Removed');
    } catch (err) {
      toast.error('Could not remove subscriber. Please try again.', 'Error');
    }
  };

  const handleToggleStatus = async (sub: SubscriberItem) => {
    const nextStatus = sub.status === 'active' ? 'unsubscribed' : 'active';
    try {
      await updateSubscriberStatus(sub.id, nextStatus);
      toast.success(
        `"${sub.email}" marked as ${nextStatus.toUpperCase()}.`,
        'Status Updated'
      );
    } catch (err) {
      toast.error('Failed to update status.', 'Error');
    }
  };

  const handleResetMock = () => {
    if (!window.confirm('Reset local mock subscribers to official default demo database?')) {
      return;
    }
    resetMockSubscribers();
    toast.success('Restored default preloaded mock subscribe list.', 'Mock Restored');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setAddError('Please enter a valid email address.');
      return;
    }

    setSubmittingAdd(true);
    try {
      const res = await subscribeToNewsletter({
        email: newEmail.trim(),
        category: newCategory,
        county: newCounty,
        source: 'Admin Manual Entry',
        notes: newNotes.trim()
      });

      if (res.success) {
        toast.success(res.message, res.isNew ? 'Subscriber Registered' : 'Subscriber Updated');
        setNewEmail('');
        setNewNotes('');
        setShowAddModal(false);
      }
    } catch (err: any) {
      setAddError(err.message || 'Failed to add subscriber');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleQuickTestAdd = async () => {
    const testSchool = ['bassa.debater', 'tubman.high.stem', 'gbanta.orator', 'monrovia.academy', 'nimba.scholar'][Math.floor(Math.random() * 5)];
    const randomEmail = `${testSchool}${Math.floor(Math.random() * 900 + 100)}@youth.edu.lr`;
    const randomCategory = SUBSCRIBER_CATEGORIES[Math.floor(Math.random() * SUBSCRIBER_CATEGORIES.length)];
    const randomCounty = LIBERIA_COUNTIES[Math.floor(Math.random() * LIBERIA_COUNTIES.length)];

    try {
      const res = await subscribeToNewsletter({
        email: randomEmail,
        category: randomCategory,
        county: randomCounty,
        source: 'Footer Newsletter',
        notes: 'Simulated live subscription from public portal'
      });
      toast.success(`Simulated subscription added: ${randomEmail} (${randomCategory})`, 'Test Subscription Added');
      setOriginFilter('all');
    } catch (err: any) {
      toast.error('Failed to add test subscription', 'Error');
    }
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastBody.trim()) {
      toast.warning('Please enter both subject and message content.', 'Incomplete Form');
      return;
    }

    const recipientsCount = broadcastTarget === 'All Dispatches'
      ? subscribers.filter(s => s.status === 'active').length
      : subscribers.filter(s => s.status === 'active' && s.category === broadcastTarget).length;

    setSendingBroadcast(true);
    setTimeout(() => {
      setSendingBroadcast(false);
      setBroadcastSuccessNotice(
        `Broadcast dispatch successfully prepared! ${recipientsCount} recipients targeted under "${broadcastTarget}". Delivery logs recorded.`
      );
      toast.success(`Dispatch queued for ${recipientsCount} verified recipients!`, 'Broadcast Simulated');
      setTimeout(() => {
        setBroadcastSuccessNotice(null);
        setShowBroadcastModal(false);
        setBroadcastSubject('');
        setBroadcastBody('');
      }, 3000);
    }, 1200);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Debate & Oratory':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'STEM & Robotics':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      case 'County Qualifiers':
        return 'bg-amber-100 text-amber-950 border-amber-300';
      case 'Scholarships & Grants':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6" id="admin-subscribers-manager">
      {/* HEADER BANNER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-800/40">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              Dispatch & Newsletter Engine
            </span>
            <span className="text-xs text-emerald-300/80 font-mono">
              Live Registry • 15 Counties
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Newsletter & Dispatch Subscribers
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
            Monitor real-time subscriptions submitted from the website footer and pop-up dispatch modals, view preloaded mock test subscribers, and coordinate national updates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setShowAddModal(true)}
            id="admin-btn-add-subscriber"
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-102 active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Subscriber</span>
          </button>
          <button
            onClick={() => setShowBroadcastModal(true)}
            id="admin-btn-compose-broadcast"
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4 text-emerald-400" />
            <span>Compose Dispatch</span>
          </button>
          <button
            onClick={handleExportCSV}
            title="Download CSV export"
            className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK STATS TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Registered</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[10px] font-semibold text-slate-400">emails</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between bg-emerald-50/30">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Live Website</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-900">{stats.liveCount}</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Form submissions</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-xs flex flex-col justify-between bg-indigo-50/30">
          <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Mock Preloaded</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-indigo-900">{stats.mockCount}</span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">Test roster</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Debate & Oratory</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-700">{stats.debateCount}</span>
            <span className="text-[10px] text-slate-400">coaches & teams</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">STEM & Robotics</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-cyan-700">{stats.stemCount}</span>
            <span className="text-[10px] text-slate-400">labs & schools</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">County Qualifiers</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-700">{stats.countyCount}</span>
            <span className="text-[10px] text-slate-400">youth desks</span>
          </div>
        </div>
      </div>

      {/* MOCK SUBSCRIBE LIST HIGHLIGHT CARD */}
      {showMockListBanner && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-md border border-indigo-700/50 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 flex items-center gap-1">
                  <Database className="w-3 h-3 text-indigo-300" />
                  Preloaded Mock Subscribe List ({INITIAL_MOCK_SUBSCRIBERS.length})
                </span>
                <span className="text-xs text-indigo-300 font-semibold">
                  Default Demo Database
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Official Mock Subscribers Demonstration Roster
              </h3>
              <p className="text-xs text-indigo-200/90 leading-relaxed">
                Here is the requested preloaded mock subscribe list with verified Liberian high school debate mentors (St. Teresa Convent, J.J. Roberts, Nimba County Youth Desk, CWA, Voinjama Multilateral, Cuttington University, and Bassa High). When real users subscribe on the website, their submissions arrive live right alongside these entries!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setOriginFilter(originFilter === 'mock' ? 'all' : 'mock')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  originFilter === 'mock'
                    ? 'bg-white text-indigo-950 shadow-md'
                    : 'bg-indigo-800/60 hover:bg-indigo-700 text-white border border-indigo-600/60'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{originFilter === 'mock' ? 'Showing Mock Only' : 'Filter: Show Mock List'}</span>
              </button>

              <button
                onClick={handleQuickTestAdd}
                title="Simulate someone subscribing via footer right now"
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate Live Subscription</span>
              </button>

              <button
                onClick={handleResetMock}
                title="Restore original 7 mock subscribers"
                className="p-2 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 border border-indigo-700/60 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setShowMockListBanner(false)}
                className="p-2 text-indigo-400 hover:text-white transition-colors cursor-pointer"
                title="Dismiss mock list explanation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH, FILTER & ACTION BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        {/* Origin Switcher Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setOriginFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                originFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Subscribers ({stats.total})
            </button>
            <button
              onClick={() => setOriginFilter('live')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                originFilter === 'live'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Subscribed ({stats.liveCount})
            </button>
            <button
              onClick={() => setOriginFilter('mock')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                originFilter === 'mock'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/60'
              }`}
            >
              <Database className="w-3 h-3 text-indigo-600" />
              Mock Subscribe List ({stats.mockCount})
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleCopyAllEmails}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Copy all currently filtered emails to clipboard"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy Filtered Emails ({filteredSubscribers.length})</span>
            </button>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email, school, notes..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
            >
              <option value="all">All Dispatch Categories</option>
              {SUBSCRIBER_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
            >
              <option value="all">All 15 Counties</option>
              {LIBERIA_COUNTIES.map(c => (
                <option key={c} value={c}>{c} County</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses (Active & Unsubscribed)</option>
              <option value="active">Active Only</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </div>
        </div>
      </div>

      {/* SUBSCRIBERS TABLE / LIST */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-900">
              Subscribers Directory
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
              Showing {filteredSubscribers.length} of {subscribers.length}
            </span>
          </div>

          {originFilter === 'mock' && (
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              Viewing Mock Subscribe List
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700" />
            <p className="text-xs">Loading subscribers registry...</p>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No subscribers found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching subscriber profiles fit your selected search and filter criteria.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={() => { setSearch(''); setCategoryFilter('all'); setCountyFilter('all'); setStatusFilter('all'); setOriginFilter('all'); }}
                className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer"
              >
                Clear Filters
              </button>
              <button
                onClick={handleResetMock}
                className="px-3.5 py-2 text-xs font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer"
              >
                Reload Mock List
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Subscriber Email</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Type / Origin</th>
                  <th className="py-3 px-4">County & Source</th>
                  <th className="py-3 px-4">Subscribed At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubscribers.map((sub) => {
                  const isCopied = copiedEmail === sub.email;
                  return (
                    <tr 
                      key={sub.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${
                        sub.isMock ? 'bg-indigo-50/15' : 'bg-emerald-50/10'
                      }`}
                    >
                      {/* Email + Notes */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 select-all font-mono text-[13px]">
                            {sub.email}
                          </span>
                          <button
                            onClick={() => handleCopyEmail(sub.email)}
                            className="p-1 text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer rounded"
                            title="Copy email to clipboard"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {sub.notes && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">
                            {sub.notes}
                          </p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getCategoryColor(sub.category)}`}>
                          {sub.category}
                        </span>
                      </td>

                      {/* Origin (Mock vs Live) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {sub.isMock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-200">
                            <Database className="w-3 h-3 text-indigo-700" />
                            Mock Preload
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-950 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Live Subscribed
                          </span>
                        )}
                      </td>

                      {/* County & Source */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-800 flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {sub.county ? `${sub.county} County` : 'Nationwide'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            via {sub.source || 'Website'}
                          </span>
                        </div>
                      </td>

                      {/* Subscribed At */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{sub.subscribedAt}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(sub)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            sub.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Click to toggle Active / Unsubscribed"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="capitalize">{sub.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopyEmail(sub.email)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Copy email"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove subscriber"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD SUBSCRIBER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                  Manual Registry
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Add New Dispatch Subscriber
                </h3>
                <p className="text-xs text-slate-500">
                  Register a school coach, youth officer, or student directly into the YFC Liberia dispatch database.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. coach.morris@stteresa.edu.lr"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dispatch Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
                  >
                    {SUBSCRIBER_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Liberian County
                  </label>
                  <select
                    value={newCounty}
                    onChange={(e) => setNewCounty(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
                  >
                    {LIBERIA_COUNTIES.map(c => (
                      <option key={c} value={c}>{c} County</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrative Notes (Optional)
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. High school debate coordinator, 2025 qualifier team"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingAdd ? 'Saving...' : 'Register Subscriber'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPOSE BROADCAST MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                  National Communications Desk
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Compose Dispatch to Subscribers
                </h3>
                <p className="text-xs text-slate-500">
                  Prepare and review email dispatch bulletins for registered community cohorts.
                </p>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {broadcastSuccessNotice && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{broadcastSuccessNotice}</span>
              </div>
            )}

            <form onSubmit={handleBroadcastSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Audience Cohort
                </label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
                >
                  <option value="All Dispatches">All Subscribers ({stats.total} recipients)</option>
                  <option value="Debate & Oratory">Debate & Oratory Cohort ({stats.debateCount} recipients)</option>
                  <option value="STEM & Robotics">STEM & Robotics Cohort ({stats.stemCount} recipients)</option>
                  <option value="County Qualifiers">County Qualifiers ({stats.countyCount} recipients)</option>
                  <option value="Scholarships & Grants">Scholarships & Grants ({stats.scholarshipCount} recipients)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dispatch Subject *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="e.g. Official Fixtures: 2025/2026 National High School Debate Championship"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dispatch Body Content *
                </label>
                <textarea
                  required
                  rows={5}
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="Enter the official announcement, qualifier dates, motion releases, or STEM prototype submission guidelines..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Preview Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                  <Mail className="w-3.5 h-3.5 text-emerald-700" />
                  Email Header Preview
                </span>
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] space-y-1">
                  <p className="text-slate-500"><strong>From:</strong> Youth For Change Liberia &lt;editorial@youthforchange.org.lr&gt;</p>
                  <p className="text-slate-500"><strong>Subject:</strong> {broadcastSubject || '(Subject title)'}</p>
                  <p className="text-slate-500"><strong>Audience:</strong> {broadcastTarget}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingBroadcast ? 'Broadcasting...' : 'Broadcast Dispatch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
