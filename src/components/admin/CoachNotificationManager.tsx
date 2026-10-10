import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  Eye, 
  RefreshCw, 
  Users, 
  Building2, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  FileText, 
  Copy, 
  Check, 
  ChevronRight, 
  Sparkles, 
  Server, 
  ExternalLink,
  Phone,
  Plus,
  X,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { 
  TournamentFixture, 
  CoachRegistration, 
  CoachNotificationLog,
  TournamentProgram,
  TournamentStage 
} from '../../types/tournament';
import { InvolvementApplication } from '../../types';
import { ACCREDITED_BASE_SCHOOLS } from '../../data/tournamentZoningData';
import { 
  resolveCoachForSchool, 
  registerCoachForAlerts, 
  subscribeToCoachRegistrations, 
  subscribeToCoachNotificationLogs,
  sendCoachFixtureAlert,
  previewCoachFixtureEmail,
  CoachContactInfo
} from '../../lib/coachNotificationService';

const LIBERIA_15_COUNTIES = [
  'Montserrado',
  'Nimba',
  'Bong',
  'Margibi',
  'Grand Bassa',
  'Lofa',
  'Maryland',
  'Grand Cape Mount',
  'Sinoe',
  'Bomi',
  'Rivercess',
  'Grand Gedeh',
  'River Gee',
  'Grand Kru',
  'Gbarpolu'
];

interface CoachNotificationManagerProps {
  fixtures: TournamentFixture[];
  onUpdateFixture: (updated: TournamentFixture) => Promise<void>;
  applicationsList?: InvolvementApplication[];
  userEmail?: string;
  initialSelectedCounty?: string;
}

export const CoachNotificationManager: React.FC<CoachNotificationManagerProps> = ({
  fixtures,
  onUpdateFixture,
  applicationsList = [],
  userEmail = 'admin@youthforchange.org.lr',
  initialSelectedCounty = 'All Counties'
}) => {
  // Navigation tabs
  const [subTab, setSubTab] = useState<'fixtures_dispatch' | 'registered_coaches' | 'audit_logs' | 'smtp_tester'>('fixtures_dispatch');

  // Filters
  const [selectedCounty, setSelectedCounty] = useState<string>(initialSelectedCounty);
  const [selectedProgram, setSelectedProgram] = useState<'all' | 'debate' | 'stem'>('all');
  const [filterConfirmationStatus, setFilterConfirmationStatus] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live Firestore subscriptions
  const [liveRegistrations, setLiveRegistrations] = useState<CoachRegistration[]>([]);
  const [auditLogs, setAuditLogs] = useState<CoachNotificationLog[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState<boolean>(true);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);

  // SMTP Status
  const [smtpStatus, setSmtpStatus] = useState<{
    isConfigured: boolean;
    host: string | null;
    port: number;
    user: string | null;
    from: string;
    adminEmail: string;
    mode: string;
  } | null>(null);

  // Dispatch Actions State
  const [dispatchingFixtureId, setDispatchingFixtureId] = useState<string | null>(null);
  const [batchDispatching, setBatchDispatching] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [actionSuccessToast, setActionSuccessToast] = useState<{ title: string; message: string } | null>(null);
  const [actionErrorToast, setActionErrorToast] = useState<string | null>(null);

  // Email Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewSide, setPreviewSide] = useState<'teamA' | 'teamB'>('teamA');
  const [previewFixture, setPreviewFixture] = useState<TournamentFixture | null>(null);
  const [previewData, setPreviewData] = useState<{ subject: string; html: string; text: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  // Custom Secretariat Dispatch Options
  const [customSecretariatNote, setCustomSecretariatNote] = useState<string>('');
  const [autoSendOnConfirm, setAutoSendOnConfirm] = useState<boolean>(true);

  // Manual Register Coach Modal
  const [showAddCoachModal, setShowAddCoachModal] = useState<boolean>(false);
  const [newCoachSchool, setNewCoachSchool] = useState<string>('');
  const [newCoachName, setNewCoachName] = useState<string>('');
  const [newCoachEmail, setNewCoachEmail] = useState<string>('');
  const [newCoachPhone, setNewCoachPhone] = useState<string>('');
  const [newCoachCounty, setNewCoachCounty] = useState<string>('Montserrado');
  const [savingCoach, setSavingCoach] = useState<boolean>(false);

  // Diagnostic Test Email state
  const [testEmailTarget, setTestEmailTarget] = useState<string>(userEmail);
  const [sendingTestEmail, setSendingTestEmail] = useState<boolean>(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  // 1. Subscribe to Live Registrations and Audit Logs
  useEffect(() => {
    const unsubRegs = subscribeToCoachRegistrations((regs) => {
      setLiveRegistrations(regs);
      setLoadingRegistrations(false);
    });

    const unsubLogs = subscribeToCoachNotificationLogs((logs) => {
      setAuditLogs(logs);
      setLoadingLogs(false);
    });

    // Check SMTP Status
    fetch('/api/smtp-status')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setSmtpStatus(d);
        }
      })
      .catch(err => console.warn('Could not fetch SMTP status:', err));

    return () => {
      unsubRegs();
      unsubLogs();
    };
  }, []);

  // Filtered Fixtures
  const filteredFixtures = useMemo(() => {
    return fixtures.filter(f => {
      if (selectedCounty !== 'All Counties' && f.county !== selectedCounty) return false;
      if (selectedProgram !== 'all' && f.program !== selectedProgram) return false;
      if (filterConfirmationStatus === 'confirmed' && !f.isConfirmed) return false;
      if (filterConfirmationStatus === 'pending' && f.isConfirmed) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTeam = f.teamA.toLowerCase().includes(q) || f.teamB.toLowerCase().includes(q);
        const matchVenue = f.venue.toLowerCase().includes(q);
        const matchMotion = f.motion.toLowerCase().includes(q);
        const matchRound = f.roundName.toLowerCase().includes(q);
        const matchHash = (f.antiBiasHash || '').toLowerCase().includes(q);
        if (!matchTeam && !matchVenue && !matchMotion && !matchRound && !matchHash) return false;
      }
      return true;
    });
  }, [fixtures, selectedCounty, selectedProgram, filterConfirmationStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = fixtures.length;
    const confirmed = fixtures.filter(f => f.isConfirmed).length;
    const pending = total - confirmed;
    const totalDispatches = auditLogs.length;
    const successfulDispatches = auditLogs.filter(l => l.status === 'sent').length;

    return {
      total,
      confirmed,
      pending,
      totalDispatches,
      successfulDispatches,
      percentConfirmed: total > 0 ? Math.round((confirmed / total) * 100) : 0
    };
  }, [fixtures, auditLogs]);

  // Handle Single Fixture Confirmation & Coach Notification
  const handleConfirmAndNotify = async (fixture: TournamentFixture) => {
    setDispatchingFixtureId(fixture.id);
    setActionErrorToast(null);

    try {
      const coachA = resolveCoachForSchool(fixture.teamA, liveRegistrations, applicationsList);
      const coachB = resolveCoachForSchool(fixture.teamB, liveRegistrations, applicationsList);

      let notifiedCount = 0;

      if (autoSendOnConfirm) {
        // Dispatch to Team A (Affirmative/Lead)
        const resA = await sendCoachFixtureAlert({
          fixture,
          schoolName: fixture.teamA.schoolName,
          opponentSchool: fixture.teamB.schoolName,
          assignedSide: fixture.program === 'debate' ? 'Affirmative (Proposition)' : 'Lead Innovation Team',
          coachName: coachA.coachName,
          coachEmail: coachA.email,
          coachPhone: coachA.phone,
          adminEmail: userEmail,
          customNotes: customSecretariatNote.trim() || undefined
        });

        if (resA.success) notifiedCount++;

        // Dispatch to Team B (Negative/Challenger)
        const resB = await sendCoachFixtureAlert({
          fixture,
          schoolName: fixture.teamB.schoolName,
          opponentSchool: fixture.teamA.schoolName,
          assignedSide: fixture.program === 'debate' ? 'Negative (Opposition)' : 'Challenger Innovation Team',
          coachName: coachB.coachName,
          coachEmail: coachB.email,
          coachPhone: coachB.phone,
          adminEmail: userEmail,
          customNotes: customSecretariatNote.trim() || undefined
        });

        if (resB.success) notifiedCount++;
      }

      // Update Fixture in Firestore
      const now = new Date().toISOString();
      const updatedFixture: TournamentFixture = {
        ...fixture,
        isConfirmed: true,
        confirmedAt: now,
        confirmedBy: userEmail,
        coachesNotifiedCount: notifiedCount,
        lastNotificationDispatchedAt: now,
        notificationStatus: autoSendOnConfirm ? 'sent' : 'not_sent',
        updatedAt: now
      };

      await onUpdateFixture(updatedFixture);

      setActionSuccessToast({
        title: 'Fixture Officially Confirmed!',
        message: autoSendOnConfirm 
          ? `Dispatched official pairing notifications to ${coachA.coachName} (${fixture.teamA}) & ${coachB.coachName} (${fixture.teamB}).`
          : `Pairing marked as confirmed. Notification auto-dispatch was bypassed.`
      });

      setTimeout(() => setActionSuccessToast(null), 5000);
    } catch (err: any) {
      console.error('Error confirming fixture and dispatching email:', err);
      setActionErrorToast(err.message || 'Failed to dispatch fixture alert.');
      setTimeout(() => setActionErrorToast(null), 6000);
    } finally {
      setDispatchingFixtureId(null);
    }
  };

  // Handle Batch Confirmation & Notification of Filtered Fixtures
  const handleBatchConfirmAndAlert = async () => {
    const pendingList = filteredFixtures.filter(f => !f.isConfirmed);
    if (pendingList.length === 0) {
      alert('All fixtures in the current view are already confirmed!');
      return;
    }

    if (!confirm(`Are you sure you want to officially confirm and dispatch email alerts for ${pendingList.length} pending fixture(s)?`)) {
      return;
    }

    setBatchDispatching(true);
    setBatchProgress({ current: 0, total: pendingList.length });
    let successCount = 0;

    for (let i = 0; i < pendingList.length; i++) {
      const fix = pendingList[i];
      setBatchProgress({ current: i + 1, total: pendingList.length });
      try {
        const coachA = resolveCoachForSchool(fix.teamA, liveRegistrations, applicationsList);
        const coachB = resolveCoachForSchool(fix.teamB, liveRegistrations, applicationsList);

        let notifiedCount = 0;
        if (autoSendOnConfirm) {
          const resA = await sendCoachFixtureAlert({
            fixture: fix,
            schoolName: fix.teamA.schoolName,
            opponentSchool: fix.teamB.schoolName,
            assignedSide: fix.program === 'debate' ? 'Affirmative (Proposition)' : 'Lead Innovation Team',
            coachName: coachA.coachName,
            coachEmail: coachA.email,
            coachPhone: coachA.phone,
            adminEmail: userEmail,
            customNotes: customSecretariatNote.trim() || undefined
          });
          if (resA.success) notifiedCount++;

          const resB = await sendCoachFixtureAlert({
            fixture: fix,
            schoolName: fix.teamB.schoolName,
            opponentSchool: fix.teamA.schoolName,
            assignedSide: fix.program === 'debate' ? 'Negative (Opposition)' : 'Challenger Innovation Team',
            coachName: coachB.coachName,
            coachEmail: coachB.email,
            coachPhone: coachB.phone,
            adminEmail: userEmail,
            customNotes: customSecretariatNote.trim() || undefined
          });
          if (resB.success) notifiedCount++;
        }

        const now = new Date().toISOString();
        const updatedFixture: TournamentFixture = {
          ...fix,
          isConfirmed: true,
          confirmedAt: now,
          confirmedBy: userEmail,
          coachesNotifiedCount: notifiedCount,
          lastNotificationDispatchedAt: now,
          notificationStatus: autoSendOnConfirm ? 'sent' : 'not_sent',
          updatedAt: now
        };

        await onUpdateFixture(updatedFixture);
        successCount++;
      } catch (err) {
        console.warn(`Batch error for fixture ${fix.id}:`, err);
      }
    }

    setBatchDispatching(false);
    setBatchProgress(null);

    setActionSuccessToast({
      title: 'Batch Confirmation Finished!',
      message: `Successfully confirmed ${successCount} fixtures and triggered alerts to school coaches.`
    });
    setTimeout(() => setActionSuccessToast(null), 6000);
  };

  // Open Preview Modal
  const handleOpenPreview = async (fixture: TournamentFixture, side: 'teamA' | 'teamB' = 'teamA') => {
    setPreviewFixture(fixture);
    setPreviewSide(side);
    setPreviewModalOpen(true);
    setPreviewLoading(true);

    const school = side === 'teamA' ? fixture.teamA : fixture.teamB;
    const opp = side === 'teamA' ? fixture.teamB : fixture.teamA;
    const assignedSide = fixture.program === 'debate'
      ? (side === 'teamA' ? 'Affirmative (Proposition)' : 'Negative (Opposition)')
      : (side === 'teamA' ? 'Lead Innovation Team' : 'Challenger Team');

    const coach = resolveCoachForSchool(school.schoolName, liveRegistrations, applicationsList);

    try {
      const res = await previewCoachFixtureEmail({
        fixture,
        schoolName: school.schoolName,
        opponentSchool: opp.schoolName,
        assignedSide,
        coachName: coach.coachName,
        coachEmail: coach.email,
        coachPhone: coach.phone,
        customNotes: customSecretariatNote.trim() || undefined
      });

      if (res.success && res.preview) {
        setPreviewData(res.preview);
      } else {
        setPreviewData(null);
      }
    } catch (err) {
      console.warn('Preview error:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Switch preview between Team A and Team B
  const handleSwitchPreviewSide = (side: 'teamA' | 'teamB') => {
    if (!previewFixture) return;
    handleOpenPreview(previewFixture, side);
  };

  // Manual Coach Registration submit
  const handleSaveManualCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoachSchool.trim() || !newCoachEmail.trim()) {
      alert('School name and coach email are required.');
      return;
    }

    setSavingCoach(true);
    try {
      await registerCoachForAlerts({
        schoolName: newCoachSchool.trim(),
        coachName: newCoachName.trim() || `${newCoachSchool} Coach`,
        email: newCoachEmail.trim(),
        phone: newCoachPhone.trim() || '+231 777 000 000',
        county: newCoachCounty,
        program: 'all',
        alertMethod: 'email',
        status: 'active',
        registeredAt: new Date().toISOString()
      });

      setShowAddCoachModal(false);
      setNewCoachSchool('');
      setNewCoachName('');
      setNewCoachEmail('');
      setNewCoachPhone('');

      setActionSuccessToast({
        title: 'Coach Registered!',
        message: `Registered ${newCoachName || 'Coach'} for ${newCoachSchool}. Fixture alerts will now automatically route to this contact.`
      });
      setTimeout(() => setActionSuccessToast(null), 4000);
    } catch (err: any) {
      alert('Failed to register coach: ' + err.message);
    } finally {
      setSavingCoach(false);
    }
  };

  // Send Test SMTP Email
  const handleSendTestEmail = async () => {
    if (!testEmailTarget.trim()) return;
    setSendingTestEmail(true);
    setTestEmailResult(null);

    try {
      const resp = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: testEmailTarget.trim() })
      });
      const data = await resp.json();
      if (data.success) {
        setTestEmailResult({
          success: true,
          message: `Test email dispatched via ${data.mode === 'smtp' ? 'Live SMTP Transport' : 'Secretariat Dispatch Queue'} to ${testEmailTarget}. MessageId: ${data.messageId}`
        });
      } else {
        setTestEmailResult({
          success: false,
          message: data.error || 'Failed to dispatch test email.'
        });
      }
    } catch (err: any) {
      setTestEmailResult({
        success: false,
        message: err.message || 'Network error executing SMTP test.'
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {actionSuccessToast && (
        <div className="p-4 bg-emerald-900/90 text-white border border-emerald-500 rounded-2xl shadow-xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <div className="font-black text-sm text-emerald-100">{actionSuccessToast.title}</div>
              <div className="text-xs text-emerald-200 mt-0.5">{actionSuccessToast.message}</div>
            </div>
          </div>
          <button 
            onClick={() => setActionSuccessToast(null)}
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionErrorToast && (
        <div className="p-4 bg-rose-900/90 text-white border border-rose-500 rounded-2xl shadow-xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
            <div>
              <div className="font-black text-sm text-rose-100">Notification Dispatch Warning</div>
              <div className="text-xs text-rose-200 mt-0.5">{actionErrorToast}</div>
            </div>
          </div>
          <button 
            onClick={() => setActionErrorToast(null)}
            className="text-rose-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
              <Mail className="w-3.5 h-3.5" /> Automated Coach Notification Dispatcher
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Fixture Confirmation & Coach Alert Gateway
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              When tournament administrators officially confirm match pairings, this automated service dispatches formal branded letters to registered school coaches—delivering confirmed debate sides, dates, venues, motions, and cryptographic anti-bias verification hashes.
            </p>
          </div>

          {/* Quick Gateway Diagnostic Badge */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shrink-0 w-full lg:w-auto space-y-2">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Email Gateway:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                smtpStatus?.isConfigured 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {smtpStatus?.isConfigured ? '🟢 Live SMTP Transport' : '🟡 Secretariat Queue Dispatcher'}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono">
              From: {smtpStatus?.from || 'admin@youthforchange.org.lr'}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
              <span>Admin CC: <strong>{userEmail}</strong></span>
              <button
                onClick={() => setSubTab('smtp_tester')}
                className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
              >
                Configure / Test
              </button>
            </div>
          </div>
        </div>

        {/* Metric Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Pairings</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">{stats.total}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">15 Counties</div>
          </div>

          <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Confirmed Fixtures</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{stats.confirmed}</div>
            <div className="text-[11px] text-emerald-300/80 mt-0.5">{stats.percentConfirmed}% confirmed</div>
          </div>

          <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-amber-400">Pending Confirmation</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{stats.pending}</div>
            <div className="text-[11px] text-amber-300/80 mt-0.5">Awaiting secretariat lock</div>
          </div>

          <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-sky-400">Alert Dispatches</div>
            <div className="text-xl sm:text-2xl font-black text-sky-400 mt-1">{stats.totalDispatches}</div>
            <div className="text-[11px] text-sky-300/80 mt-0.5">Recorded in audit logs</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs overflow-x-auto gap-1">
        <button
          onClick={() => setSubTab('fixtures_dispatch')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'fixtures_dispatch'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>1. Fixture Confirmations & Dispatch Center</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            subTab === 'fixtures_dispatch' ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-200 text-slate-700'
          }`}>
            {filteredFixtures.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('registered_coaches')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'registered_coaches'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. Registered School Coaches</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            subTab === 'registered_coaches' ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-200 text-slate-700'
          }`}>
            {liveRegistrations.length + ACCREDITED_BASE_SCHOOLS.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('audit_logs')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'audit_logs'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Real-Time Alert Audit Logs</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            subTab === 'audit_logs' ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-200 text-slate-700'
          }`}>
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('smtp_tester')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'smtp_tester'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>4. Email Template & SMTP Gateway</span>
        </button>
      </div>

      {/* SUBTAB 1: FIXTURES CONFIRMATIONS & DISPATCH CENTER */}
      {subTab === 'fixtures_dispatch' && (
        <div className="space-y-6">
          {/* Dispatch Settings & Quick Options Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* County Filter */}
                <div className="flex items-center gap-1.5 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-700 uppercase">County:</span>
                  <select
                    value={selectedCounty}
                    onChange={(e) => setSelectedCounty(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="All Counties">All 15 Counties</option>
                    {LIBERIA_15_COUNTIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Program Filter */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-slate-700 uppercase">Program:</span>
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="all">All Programs</option>
                    <option value="debate">Debate Championship</option>
                    <option value="stem">STEM Innovation Challenge</option>
                  </select>
                </div>

                {/* Confirmation Status */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-slate-700 uppercase">Status:</span>
                  <select
                    value={filterConfirmationStatus}
                    onChange={(e) => setFilterConfirmationStatus(e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="all">All Fixtures</option>
                    <option value="pending">⏳ Pending Confirmation Only</option>
                    <option value="confirmed">✅ Confirmed & Alerted Only</option>
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search school, motion, venue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>
            </div>

            {/* Automation Rules Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={autoSendOnConfirm}
                    onChange={(e) => setAutoSendOnConfirm(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span>Automate Email Dispatch: Instantly alert both coaches upon confirmation</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={batchDispatching || filteredFixtures.filter(f => !f.isConfirmed).length === 0}
                  onClick={handleBatchConfirmAndAlert}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-40"
                >
                  {batchDispatching ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirming {batchProgress?.current}/{batchProgress?.total}...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span>Confirm & Alert All Filtered Pending ({filteredFixtures.filter(f => !f.isConfirmed).length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Custom Secretariat Note Input (Included in all triggered emails) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 whitespace-nowrap">Secretariat Custom Notice:</span>
              <input
                type="text"
                value={customSecretariatNote}
                onChange={(e) => setCustomSecretariatNote(e.target.value)}
                placeholder="Optional custom notice for coaches (e.g., 'Debaters must report with valid school ID badges 60 mins prior')"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Fixtures List */}
          {filteredFixtures.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Mail className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No fixtures matched the selected filter</h3>
              <p className="text-xs text-slate-500">Try adjusting the county filter, search terms, or confirmation status.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFixtures.map((fixture) => {
                const coachA = resolveCoachForSchool(fixture.teamA, liveRegistrations, applicationsList);
                const coachB = resolveCoachForSchool(fixture.teamB, liveRegistrations, applicationsList);
                const isDispatching = dispatchingFixtureId === fixture.id;

                return (
                  <div 
                    key={fixture.id}
                    className={`bg-white rounded-2xl border transition-all p-5 shadow-xs hover:shadow-md ${
                      fixture.isConfirmed 
                        ? 'border-emerald-200 bg-emerald-50/10' 
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Fixture Header Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">
                          {fixture.roundName}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {fixture.county} County
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600 uppercase font-semibold text-[11px]">
                          {fixture.stage.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Seed: {fixture.antiBiasHash}
                        </span>
                      </div>

                      {/* Confirmation Status Badge */}
                      <div>
                        {fixture.isConfirmed ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[11px] border border-emerald-300">
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            Confirmed & Alerted ({fixture.coachesNotifiedCount || 2} Coaches)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px] border border-amber-300">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            Pending Official Confirmation
                          </span>
                        )}
                      </div>
                    </div>

                    {/* School Versus Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                      {/* Team A Card */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase">
                            {fixture.program === 'debate' ? 'Proposition / Affirmative' : 'Lead Team'}
                          </span>
                          <span className="text-slate-400 text-[10px] font-mono">
                            Source: {coachA.source}
                          </span>
                        </div>
                        <div className="font-black text-slate-900 text-base">{fixture.teamA.schoolName}</div>
                        <div className="space-y-1 text-xs text-slate-600 border-t border-slate-200/80 pt-2">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>Coach: <strong>{coachA.coachName}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-800">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{coachA.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{coachA.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Team B Card */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold text-[10px] uppercase">
                            {fixture.program === 'debate' ? 'Opposition / Negative' : 'Challenger Team'}
                          </span>
                          <span className="text-slate-400 text-[10px] font-mono">
                            Source: {coachB.source}
                          </span>
                        </div>
                        <div className="font-black text-slate-900 text-base">{fixture.teamB.schoolName}</div>
                        <div className="space-y-1 text-xs text-slate-600 border-t border-slate-200/80 pt-2">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>Coach: <strong>{coachB.coachName}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-800">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{coachB.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{coachB.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Logistics & Motion Bar */}
                    <div className="bg-slate-950 text-white p-3.5 rounded-xl text-xs space-y-2 mb-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>{fixture.matchDate} at {fixture.matchTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-bold text-emerald-200">{fixture.venue}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-start gap-2">
                        <span className="font-bold text-amber-400 uppercase text-[10px] shrink-0">Motion:</span>
                        <p className="text-slate-200 italic font-medium leading-relaxed">
                          &quot;{fixture.motion}&quot;
                        </p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div className="text-[11px] text-slate-500">
                        {fixture.isConfirmed ? (
                          <span>Confirmed on {new Date(fixture.confirmedAt || fixture.createdAt).toLocaleDateString()} by {fixture.confirmedBy || 'Secretariat'}</span>
                        ) : (
                          <span className="text-amber-700 font-medium">Official confirmation pending before coaches are alerted</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Preview Official Email Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(fixture, 'teamA')}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Preview Coach Letter</span>
                        </button>

                        {/* Main Confirm & Alert Button */}
                        <button
                          type="button"
                          disabled={isDispatching}
                          onClick={() => handleConfirmAndNotify(fixture)}
                          className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
                            fixture.isConfirmed
                              ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                              : 'bg-emerald-800 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {isDispatching ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Dispatching Official Alerts...</span>
                            </>
                          ) : fixture.isConfirmed ? (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Resend Confirmation to Coaches</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5 text-yellow-300" />
                              <span>Confirm Pairing & Alert Coaches</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: REGISTERED SCHOOL COACHES DIRECTORY */}
      {subTab === 'registered_coaches' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-lg font-black text-slate-900">Registered School Coaches & Alert Subscribers</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                School coaches subscribing via the public fixtures portal, tournament applications, or the accredited county roster.
              </p>
            </div>
            <button
              onClick={() => setShowAddCoachModal(true)}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Register New Coach Contact
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-3.5">School / Institution</th>
                    <th className="p-3.5">County</th>
                    <th className="p-3.5">Coach / Representative</th>
                    <th className="p-3.5">Email (Alert Destination)</th>
                    <th className="p-3.5">Phone (SMS)</th>
                    <th className="p-3.5">Source & Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {/* Render Live Firestore Registrations First */}
                  {liveRegistrations.map((coach) => (
                    <tr key={coach.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-black text-slate-900">{coach.schoolName}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                          {coach.county}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">{coach.coachName}</td>
                      <td className="p-3.5 font-mono text-emerald-700 font-semibold">{coach.email}</td>
                      <td className="p-3.5 font-mono text-slate-500">{coach.phone || 'N/A'}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 text-[10px] font-bold border border-sky-200">
                          Direct Subscriber
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setTestEmailTarget(coach.email);
                            setSubTab('smtp_tester');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] cursor-pointer"
                        >
                          Send Test
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Render Accredited Base Schools */}
                  {ACCREDITED_BASE_SCHOOLS.map((school) => (
                    <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-black text-slate-900">{school.name}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {school.county}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">{school.contactPerson || 'Lead Advisor'}</td>
                      <td className="p-3.5 font-mono text-emerald-700 font-semibold">{school.contactEmail || `coach.${school.id}@youthforchange.org.lr`}</td>
                      <td className="p-3.5 font-mono text-slate-500">{school.contactPhone}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                          Accredited Roster
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setTestEmailTarget(school.contactEmail || `coach.${school.id}@youthforchange.org.lr`);
                            setSubTab('smtp_tester');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] cursor-pointer"
                        >
                          Send Test
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: REAL-TIME ALERT AUDIT LOGS */}
      {subTab === 'audit_logs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-lg font-black text-slate-900">Official Coach Alert Audit Trail</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every email notification triggered upon fixture confirmation is logged in real-time with delivery mode and cryptographic timestamp.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Total Logged: <strong>{auditLogs.length}</strong></span>
            </div>
          </div>

          {auditLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No alerts have been dispatched yet</h3>
              <p className="text-xs text-slate-500">
                Go to Tab 1 (&quot;Fixture Confirmations & Dispatch Center&quot;) and click &quot;Confirm Pairing & Alert Coaches&quot; on any fixture.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-3.5">Dispatched At</th>
                      <th className="p-3.5">Recipient School & Coach</th>
                      <th className="p-3.5">Coach Email Address</th>
                      <th className="p-3.5">Match Details & Side</th>
                      <th className="p-3.5">Delivery Mode</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.dispatchedAt).toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <div className="font-black text-slate-900">{log.schoolName}</div>
                          <div className="text-[11px] text-slate-500">Coach: {log.coachName}</div>
                        </td>
                        <td className="p-3.5 font-mono text-emerald-800 font-semibold">
                          {log.recipientEmail}
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <div className="font-semibold text-slate-800 truncate">{log.roundName} ({log.county})</div>
                          <div className="text-[11px] text-slate-500 truncate">{log.sideAssigned || 'Assigned Side'}</div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.deliveryMode === 'smtp'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {log.deliveryMode === 'smtp' ? 'Live SMTP' : 'Dispatch Queue'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            log.status === 'sent' 
                              ? 'bg-emerald-100 text-emerald-900' 
                              : 'bg-rose-100 text-rose-900'
                          }`}>
                            {log.status === 'sent' ? '✅ Dispatched' : '❌ Failed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: EMAIL TEMPLATE & SMTP GATEWAY DIAGNOSTIC */}
      {subTab === 'smtp_tester' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-xl font-black text-slate-900">SMTP Gateway Connection & Live Test</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Test and verify that email notifications can reach registered coaches&apos; inboxes without delays or deliverability bottlenecks.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Current System Mode:</span>
                <span className={`text-xs font-black px-3 py-1 rounded-full inline-block mt-0.5 ${
                  smtpStatus?.isConfigured 
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {smtpStatus?.isConfigured ? 'Live SMTP Gateway Connected' : 'Secretariat Queue Dispatcher (Simulated Mode)'}
                </span>
              </div>
            </div>

            {/* Test Email Dispatch Form */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-700" />
                Dispatch Test Connection Email
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="email"
                  value={testEmailTarget}
                  onChange={(e) => setTestEmailTarget(e.target.value)}
                  placeholder="Enter target recipient email (e.g. admin@youthforchange.org.lr)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                />
                <button
                  type="button"
                  disabled={sendingTestEmail}
                  onClick={handleSendTestEmail}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {sendingTestEmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching Test...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Diagnostic Alert</span>
                    </>
                  )}
                </button>
              </div>

              {testEmailResult && (
                <div className={`p-4 rounded-xl text-xs ${
                  testEmailResult.success 
                    ? 'bg-emerald-100 border border-emerald-300 text-emerald-900' 
                    : 'bg-rose-100 border border-rose-300 text-rose-900'
                }`}>
                  <div className="font-black">{testEmailResult.success ? '✅ Test Completed' : '❌ Test Warning'}</div>
                  <div className="mt-1 leading-relaxed">{testEmailResult.message}</div>
                </div>
              )}
            </div>

            {/* SMTP Environment Variable Reference */}
            <div className="space-y-3">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Production SMTP Credentials Reference
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                To send emails via your organization&apos;s live SMTP mail service (Google Workspace, Microsoft 365, AWS SES, or SendGrid), provide the following in your container environment settings:
              </p>
              <div className="bg-slate-900 text-emerald-300 p-4 rounded-xl font-mono text-xs space-y-1.5 overflow-x-auto">
                <div>SMTP_HOST=smtp.gmail.com</div>
                <div>SMTP_PORT=587</div>
                <div>SMTP_USER=admin@youthforchange.org.lr</div>
                <div>SMTP_PASS=your-16-character-app-password</div>
                <div>SMTP_FROM=&quot;Youth For Change Liberia Secretariat &lt;admin@youthforchange.org.lr&gt;&quot;</div>
                <div>ADMIN_ALERT_EMAIL=admin@youthforchange.org.lr</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL PREVIEW MODAL */}
      {previewModalOpen && previewFixture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-200">
                  <Mail className="w-3.5 h-3.5 text-emerald-700" /> Official Secretariat Dispatch Preview
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  Coach Pairing Confirmation Letter
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  This exact official template is dispatched to school coaches when fixture pairings are officially confirmed.
                </p>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Switch Side Selector */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 uppercase text-[11px]">Preview Recipient Delegation:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSwitchPreviewSide('teamA')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    previewSide === 'teamA'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {previewFixture.teamA} (Affirmative)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchPreviewSide('teamB')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    previewSide === 'teamB'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {previewFixture.teamB} (Negative)
                </button>
              </div>
            </div>

            {/* Subject Line Preview */}
            <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Subject Line</span>
              <div className="font-semibold text-slate-900 font-mono">
                {previewData?.subject || `Official Match Confirmation: ${previewFixture.teamA} vs. ${previewFixture.teamB}`}
              </div>
            </div>

            {/* HTML Render Body */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-slate-50">
              {previewLoading ? (
                <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-700" />
                  <p>Generating high-fidelity HTML email template...</p>
                </div>
              ) : (
                <div 
                  className="p-4 sm:p-6 bg-white overflow-x-auto max-h-[420px] overflow-y-auto text-xs"
                  dangerouslySetInnerHTML={{ __html: previewData?.html || '' }}
                />
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close Preview
              </button>

              <button
                type="button"
                onClick={() => {
                  setPreviewModalOpen(false);
                  handleConfirmAndNotify(previewFixture);
                }}
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm Fixture & Dispatch Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ADD COACH CONTACT MODAL */}
      {showAddCoachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">Register Coach / School Contact</h3>
                <p className="text-xs text-slate-500 mt-0.5">Add direct email and phone for tournament alerts.</p>
              </div>
              <button
                onClick={() => setShowAddCoachModal(false)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualCoach} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">School / Institution Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. William V.S. Tubman High School"
                  value={newCoachSchool}
                  onChange={(e) => setNewCoachSchool(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coach / Advisor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kolu G. Brown"
                    value={newCoachName}
                    onChange={(e) => setNewCoachName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">County *</label>
                  <select
                    value={newCoachCounty}
                    onChange={(e) => setNewCoachCounty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold"
                  >
                    {LIBERIA_15_COUNTIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coach Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="coach@school.edu.lr"
                    value={newCoachEmail}
                    onChange={(e) => setNewCoachEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone (SMS Alerts)</label>
                  <input
                    type="tel"
                    placeholder="+231 777 000 000"
                    value={newCoachPhone}
                    onChange={(e) => setNewCoachPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCoachModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCoach}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingCoach ? 'Saving...' : 'Save & Register Coach'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
