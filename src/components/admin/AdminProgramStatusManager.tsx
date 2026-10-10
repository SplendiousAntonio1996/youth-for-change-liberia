import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Unlock, 
  Sparkles, 
  Save, 
  RotateCcw, 
  Calendar, 
  AlertCircle, 
  ShieldCheck, 
  Flame, 
  Cpu, 
  Users, 
  BookOpen, 
  Award,
  Layers,
  Check,
  Eye,
  Clock,
  Info
} from 'lucide-react';
import { ProgramStatus } from '../../types';
import { useProgramStatus } from '../../hooks/useProgramStatus';
import { useToast } from '../../context/ToastContext';

interface AdminProgramStatusManagerProps {
  adminEmail?: string;
}

const PROGRAM_ICONS: Record<string, React.ElementType> = {
  'debate-prog': Flame,
  'stem-prog': Cpu,
  'mentorship': Users,
  'academic': BookOpen,
  'leadership-prog': Award
};

export const AdminProgramStatusManager: React.FC<AdminProgramStatusManagerProps> = ({ adminEmail }) => {
  const { statusesMap, statusesList, updateStatus, batchUpdate, loading } = useProgramStatus();
  const toast = useToast();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [batchSaving, setBatchSaving] = useState<boolean>(false);

  // Editable local state for custom fields before saving
  const [editForms, setEditForms] = useState<Record<string, Partial<ProgramStatus>>>({});

  const getFormValue = (programId: string, field: keyof ProgramStatus) => {
    if (editForms[programId] && editForms[programId][field] !== undefined) {
      return editForms[programId][field];
    }
    const current = statusesMap[programId];
    return current ? (current[field] as any) : '';
  };

  const handleFieldChange = (programId: string, field: keyof ProgramStatus, value: any) => {
    setEditForms(prev => ({
      ...prev,
      [programId]: {
        ...prev[programId],
        [field]: value
      }
    }));
  };

  const handleToggle = async (programId: string, currentOpen: boolean) => {
    const nextOpen = !currentOpen;
    const currentProg = statusesMap[programId];
    const defaultLabel = nextOpen ? 'Open Now, Register' : 'Closed - Not Open Yet';
    
    setSavingId(programId);
    try {
      await updateStatus(programId, {
        isOpen: nextOpen,
        statusLabel: defaultLabel
      }, adminEmail);

      // Clean local edit state for this program's isOpen
      setEditForms(prev => ({
        ...prev,
        [programId]: {
          ...prev[programId],
          isOpen: nextOpen,
          statusLabel: defaultLabel
        }
      }));

      toast.success(
        nextOpen 
          ? `"${currentProg?.title || programId}" is now OPEN for registration!` 
          : `"${currentProg?.title || programId}" registration is now CLOSED.`
      );
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update program status. Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveDetails = async (programId: string) => {
    const currentProg = statusesMap[programId];
    const formValues = editForms[programId] || {};

    setSavingId(programId);
    try {
      await updateStatus(programId, {
        ...formValues,
        isOpen: formValues.isOpen !== undefined ? formValues.isOpen : currentProg.isOpen
      }, adminEmail);

      toast.success(`Saved customized registration settings for ${currentProg.title}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings.');
    } finally {
      setSavingId(null);
    }
  };

  const handleQuickPresetDebateOnly = async () => {
    setBatchSaving(true);
    try {
      await batchUpdate({
        'debate-prog': true,
        'stem-prog': false,
        'mentorship': false,
        'academic': false,
        'leadership-prog': false
      }, adminEmail);

      toast.success('Preset Applied: National Debate is OPEN, all other programs CLOSED.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to apply preset.');
    } finally {
      setBatchSaving(false);
    }
  };

  const handleQuickCloseAll = async () => {
    if (!confirm('Are you sure you want to CLOSE registration for ALL 5 programs?')) return;
    setBatchSaving(true);
    try {
      await batchUpdate({
        'debate-prog': false,
        'stem-prog': false,
        'mentorship': false,
        'academic': false,
        'leadership-prog': false
      }, adminEmail);

      toast.success('All programs are now CLOSED for registration.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to close programs.');
    } finally {
      setBatchSaving(false);
    }
  };

  const handleQuickOpenAll = async () => {
    if (!confirm('Are you sure you want to OPEN registration for ALL programs simultaneously?')) return;
    setBatchSaving(true);
    try {
      await batchUpdate({
        'debate-prog': true,
        'stem-prog': true,
        'mentorship': true,
        'academic': true,
        'leadership-prog': true
      }, adminEmail);

      toast.success('All programs are now OPEN for registration.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to open all programs.');
    } finally {
      setBatchSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Intake & Enrollment Guard
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Live Firestore Real-Time Sync
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Program Registration Controls
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Open or close public registration for each program. When a program is marked 
              <strong className="text-slate-800 font-bold"> "Closed"</strong>, visitors cannot register, and the site displays a clear notice to prevent premature applications.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2.5 items-center">
            <button
              type="button"
              onClick={handleQuickPresetDebateOnly}
              disabled={batchSaving}
              className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Debate Open Only (Default)</span>
            </button>

            <button
              type="button"
              onClick={handleQuickCloseAll}
              disabled={batchSaving}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Close All</span>
            </button>

            <button
              type="button"
              onClick={handleQuickOpenAll}
              disabled={batchSaving}
              className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              <Unlock className="w-3.5 h-3.5 text-amber-700" />
              <span>Open All</span>
            </button>
          </div>
        </div>

        {/* Informative Status Strip */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {statusesList.map(prog => {
            const Icon = PROGRAM_ICONS[prog.id] || Layers;
            return (
              <div 
                key={prog.id}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  prog.isOpen 
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-xs' 
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${prog.isOpen ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-bold truncate">{prog.title.split(' ')[0]}</span>
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider">
                  {prog.isOpen ? (
                    <span className="text-emerald-700 flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      Open Now
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center justify-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Closed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Program Status Cards */}
      <div className="space-y-6">
        {statusesList.map((prog) => {
          const Icon = PROGRAM_ICONS[prog.id] || Layers;
          const currentIsOpen = prog.isOpen;
          const isSaving = savingId === prog.id;

          const currentLabel = (getFormValue(prog.id, 'statusLabel') || (currentIsOpen ? 'Open Now, Register' : 'Closed - Not Open Yet')) as string;
          const currentNotice = currentIsOpen 
            ? (getFormValue(prog.id, 'openNotice') || prog.openNotice || '') as string
            : (getFormValue(prog.id, 'closedNotice') || prog.closedNotice || '') as string;
          const currentDeadline = (getFormValue(prog.id, 'registrationDeadline') || prog.registrationDeadline || '') as string;
          const currentTarget = (getFormValue(prog.id, 'targetAudience') || prog.targetAudience || '') as string;

          return (
            <div 
              key={prog.id}
              className={`bg-white rounded-3xl border transition-all shadow-xs ${
                currentIsOpen 
                  ? 'border-emerald-300 ring-2 ring-emerald-500/10' 
                  : 'border-slate-200'
              }`}
            >
              {/* Card Header & Toggle Bar */}
              <div className="p-6 sm:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100">
                <div className="flex items-start sm:items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    currentIsOpen 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">
                        {prog.title}
                      </h3>
                      {currentIsOpen ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          Registration Open
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-300 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          Registration Closed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {prog.subtitle || 'Youth For Change Liberia Core Program'}
                    </p>
                  </div>
                </div>

                {/* Primary Toggle Switch */}
                <div className="flex items-center gap-3 self-end md:self-center">
                  <span className="text-xs font-bold text-slate-600">
                    Status:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggle(prog.id, currentIsOpen)}
                    disabled={isSaving}
                    className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                      currentIsOpen ? 'bg-emerald-700' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                        currentIsOpen ? 'translate-x-8 text-emerald-800' : 'translate-x-0 text-slate-400'
                      }`}
                    >
                      {currentIsOpen ? (
                        <Check className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggle(prog.id, currentIsOpen)}
                    disabled={isSaving}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      currentIsOpen
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {currentIsOpen ? 'Close Registration' : 'Open Registration'}
                  </button>
                </div>
              </div>

              {/* Card Body with Detailed Settings & Live Visitor Preview */}
              <div className="p-6 sm:p-7 space-y-6">
                {/* Live Visitor Preview Pill */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      Visitor Preview (What users see on the website):
                    </span>
                    <span className={currentIsOpen ? 'text-emerald-700 font-black' : 'text-slate-600 font-black'}>
                      {currentIsOpen ? 'Active Registration CTA' : 'Disabled / Closed State'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                          currentIsOpen 
                            ? 'bg-yellow-400 text-emerald-950 shadow-xs' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {currentIsOpen ? '● OPEN NOW' : '● CLOSED'}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {currentLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                        {currentNotice}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {currentIsOpen ? (
                        <div className="px-4 py-2 rounded-xl bg-yellow-400 text-emerald-950 font-black text-xs shadow-xs flex items-center gap-1.5 cursor-default">
                          <span>Open Now, Register</span>
                        </div>
                      ) : (
                        <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 border border-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-not-allowed">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Registration Closed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Controls for Custom Text & Deadlines */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Public Status Label
                    </label>
                    <input
                      type="text"
                      value={currentLabel}
                      onChange={(e) => handleFieldChange(prog.id, 'statusLabel', e.target.value)}
                      placeholder={currentIsOpen ? "Open Now, Register" : "Closed - Not Open Yet"}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-800 focus:ring-1 focus:ring-emerald-800 bg-white"
                    />
                    <p className="text-[11px] text-slate-500">
                      Displayed on buttons and cards across the website.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Registration Deadline / Season
                    </label>
                    <input
                      type="text"
                      value={currentDeadline}
                      onChange={(e) => handleFieldChange(prog.id, 'registrationDeadline', e.target.value)}
                      placeholder="e.g., October 30, 2025 or TBD"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-800 focus:ring-1 focus:ring-emerald-800 bg-white"
                    />
                    <p className="text-[11px] text-slate-500">
                      Helpful timeline note for prospective schools and scholars.
                    </p>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {currentIsOpen ? 'Public Open Notice / Instructions' : 'Public Closed Notice (Why it is not open yet)'}
                    </label>
                    <textarea
                      rows={2}
                      value={currentNotice}
                      onChange={(e) => {
                        const key = currentIsOpen ? 'openNotice' : 'closedNotice';
                        handleFieldChange(prog.id, key, e.target.value);
                      }}
                      placeholder={
                        currentIsOpen 
                          ? "Enter instructions for applicants..." 
                          : "Explain that the program is not open yet and when it might open..."
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-800 focus:ring-1 focus:ring-emerald-800 bg-white"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Target Audience / Eligibility Note
                    </label>
                    <input
                      type="text"
                      value={currentTarget}
                      onChange={(e) => handleFieldChange(prog.id, 'targetAudience', e.target.value)}
                      placeholder="e.g. Accredited Senior High Schools across Liberia"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-800 focus:ring-1 focus:ring-emerald-800 bg-white"
                    />
                  </div>
                </div>

                {/* Save Changes Button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Last updated: {prog.updatedAt ? new Date(prog.updatedAt).toLocaleDateString() : 'Baseline Default'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSaveDetails(prog.id)}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
