import React, { useState } from 'react';
import { 
  Database, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Shuffle, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  Check,
  X
} from 'lucide-react';
import { DebateMotion } from '../../types/tournament';
import { useMotionBank } from '../../hooks/useMotionBank';

interface MotionBankManagerProps {
  adminEmail?: string;
  onSelectMotionForFixture?: (motionText: string, domain: string, infoSlide?: string) => void;
}

export const MotionBankManager: React.FC<MotionBankManagerProps> = ({ 
  adminEmail,
  onSelectMotionForFixture 
}) => {
  const { 
    motions, 
    loading, 
    addMotion, 
    updateMotion, 
    deleteMotion, 
    seedDefaults,
    pickRandomMotion 
  } = useMotionBank();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [isAddingMotion, setIsAddingMotion] = useState(false);
  const [editingMotionId, setEditingMotionId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    motionText: string;
    domain: string;
    infoSlide: string;
    preparationType: string;
    roundDesignation: string;
  }>({
    motionText: '',
    domain: 'Governance & Constitution',
    infoSlide: '',
    preparationType: 'Prepared Motion (Announced in Advance)',
    roundDesignation: 'Zonal Prelims'
  });

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [sampledRandomMotion, setSampledRandomMotion] = useState<DebateMotion | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleSaveMotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.motionText.trim()) return;

    if (editingMotionId) {
      await updateMotion(editingMotionId, {
        motionText: formData.motionText.trim(),
        domain: formData.domain,
        infoSlide: formData.infoSlide.trim() || undefined,
        preparationType: formData.preparationType,
        roundDesignation: formData.roundDesignation
      });
      showNotification('Motion successfully updated in the official bank.');
      setEditingMotionId(null);
    } else {
      await addMotion({
        motionText: formData.motionText.trim(),
        domain: formData.domain,
        infoSlide: formData.infoSlide.trim() || undefined,
        preparationType: formData.preparationType,
        roundDesignation: formData.roundDesignation
      }, adminEmail);
      showNotification('New motion added to the official bank!');
      setIsAddingMotion(false);
    }

    setFormData({
      motionText: '',
      domain: 'Governance & Constitution',
      infoSlide: '',
      preparationType: 'Prepared Motion (Announced in Advance)',
      roundDesignation: 'Zonal Prelims'
    });
  };

  const handleStartEdit = (motion: DebateMotion) => {
    setEditingMotionId(motion.id);
    setFormData({
      motionText: motion.motionText,
      domain: motion.domain,
      infoSlide: motion.infoSlide || '',
      preparationType: motion.preparationType,
      roundDesignation: motion.roundDesignation || 'Zonal Prelims'
    });
    setIsAddingMotion(true);
  };

  const handleDelete = async (id: string, text: string) => {
    if (window.confirm(`Are you sure you want to remove this motion from the bank?\n\n"${text.slice(0, 70)}..."`)) {
      await deleteMotion(id);
      showNotification('Motion removed from bank.');
    }
  };

  const handleSeedDefaults = async () => {
    const count = await seedDefaults(adminEmail);
    showNotification(`Successfully synced ${count} accredited national motions into the bank!`);
  };

  const handleSampleRandom = () => {
    const motion = pickRandomMotion(selectedStage !== 'all' ? selectedStage : undefined);
    setSampledRandomMotion(motion);
  };

  // Filter motions
  const filteredMotions = motions.filter(m => {
    const matchesQuery = 
      m.motionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.infoSlide && m.infoSlide.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.domain.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDomain = selectedDomain === 'all' || m.domain === selectedDomain;
    const matchesStage = selectedStage === 'all' || m.roundDesignation === selectedStage;

    return matchesQuery && matchesDomain && matchesStage;
  });

  const domains = Array.from(new Set(motions.map(m => m.domain)));

  return (
    <div className="space-y-6" id="admin-motion-bank-box">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-slate-900 rounded-2xl text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                <Database className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Official Debate Motion Bank
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Centrally manage accredited motions for preliminary rounds, county knockouts, and the national championship. 
              The tournament draw engine randomly pairs teams with motions from this verified bank.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setEditingMotionId(null);
                setFormData({
                  motionText: '',
                  domain: 'Governance & Constitution',
                  infoSlide: '',
                  preparationType: 'Prepared Motion (Announced in Advance)',
                  roundDesignation: 'Zonal Prelims'
                });
                setIsAddingMotion(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Deposit New Motion</span>
            </button>
            <button
              onClick={handleSeedDefaults}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Ensure all 18+ accredited national curriculum motions are loaded into Firestore"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sync Accredited Motions</span>
            </button>
          </div>
        </div>

        {/* Live Bank Metrics */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Total Motions in Bank</span>
            <span className="text-xl font-black text-emerald-400">{motions.length}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Zonal Prelims Pool</span>
            <span className="text-xl font-black text-cyan-400">
              {motions.filter(m => (m.roundDesignation || '').includes('Prelim') || (m.roundDesignation || '').includes('Zonal')).length}
            </span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">Next Round & Knockouts</span>
            <span className="text-xl font-black text-amber-400">
              {motions.filter(m => (m.roundDesignation || '').includes('Knockout') || (m.roundDesignation || '').includes('County')).length}
            </span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block">National Championship</span>
            <span className="text-xl font-black text-purple-400">
              {motions.filter(m => (m.roundDesignation || '').includes('National')).length}
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs sm:text-sm text-emerald-950 flex items-center gap-2 shadow-xs transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* Add / Edit Motion Modal Form */}
      {isAddingMotion && (
        <div className="p-5 sm:p-6 bg-white border border-emerald-200 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <BookOpen className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {editingMotionId ? 'Edit Bank Motion' : 'Deposit New Debate Motion into Bank'}
              </h3>
            </div>
            <button
              onClick={() => {
                setIsAddingMotion(false);
                setEditingMotionId(null);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveMotion} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Motion Text (Debate Resolution) *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. This House Would Mandate That 50% of County Social Development Funds (CSDF) Be Exclusively Ring-Fenced for High School Science Laboratories..."
                value={formData.motionText}
                onChange={e => setFormData({ ...formData, motionText: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <span className="text-[11px] text-slate-500">
                Tip: Standard LNDC Parliamentary format begins with "This House Would / Believes That / Supports / Regrets..."
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thematic Domain / Category *
                </label>
                <select
                  value={formData.domain}
                  onChange={e => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Governance & Constitution">Governance & Constitution</option>
                  <option value="Economics & Resource Rights">Economics & Resource Rights</option>
                  <option value="STEM & Climate">STEM & Climate</option>
                  <option value="Education & Gender">Education & Gender</option>
                  <option value="International Relations">International Relations</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Round Designation *
                </label>
                <select
                  value={formData.roundDesignation}
                  onChange={e => setFormData({ ...formData, roundDesignation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Zonal Prelims">Zonal Prelims (Round 1-3)</option>
                  <option value="Next Round Knockout">Next Round Knockout / Quarterfinals</option>
                  <option value="County Final">County Finals Grand Face-Off</option>
                  <option value="National Championship">National Championship Super 16</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preparation Release Protocol *
                </label>
                <select
                  value={formData.preparationType}
                  onChange={e => setFormData({ ...formData, preparationType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Prepared Motion (Announced in Advance)">Prepared Motion (Announced in Advance)</option>
                  <option value="Impromptu Motion (1-Hour Release)">Impromptu Motion (1-Hour Release)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Context Slide / Information Note (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Background context, statutory references (e.g. Land Rights Act, CSDF, Constitution Article 8), or definitions for adjudicators and debaters..."
                value={formData.infoSlide}
                onChange={e => setFormData({ ...formData, infoSlide: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingMotion(false);
                  setEditingMotionId(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingMotionId ? 'Save Updates' : 'Add to Bank'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interactive Controls & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search motions by keywords (e.g. CSDF, WASSCE, mineral, carbon, climate)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDomain}
              onChange={e => setSelectedDomain(e.target.value)}
              className="bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Domains ({motions.length})</option>
              {domains.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value)}
              className="bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Stages</option>
              <option value="Zonal Prelims">Zonal Prelims</option>
              <option value="Next Round Knockout">Next Round Knockout</option>
              <option value="County Final">County Finals</option>
              <option value="National Championship">National Championship</option>
            </select>

            <button
              onClick={handleSampleRandom}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Test the impartial random motion draw engine"
            >
              <Shuffle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Test Random Draw</span>
            </button>
          </div>
        </div>

        {/* Random Draw Sample Modal / Callout */}
        {sampledRandomMotion && (
          <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-start justify-between gap-3 text-xs text-emerald-950">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[10px] uppercase">
                  Impartial Random Draw Result
                </span>
                <span className="font-bold text-emerald-900">{sampledRandomMotion.domain}</span>
                <span className="text-[10px] text-emerald-700">({sampledRandomMotion.roundDesignation})</span>
              </div>
              <p className="font-semibold text-slate-900 leading-snug">
                "{sampledRandomMotion.motionText}"
              </p>
            </div>
            <button
              onClick={() => setSampledRandomMotion(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Motions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Showing {filteredMotions.length} motions</span>
          <span>Seeded from the National Curriculum & Secretariat Archive</span>
        </div>

        {filteredMotions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No motions match the selected filters</p>
            <p className="text-xs text-slate-500">Try adjusting your search query or domain selection above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredMotions.map((motion, idx) => (
              <div 
                key={motion.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all shadow-xs space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-black text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                      {motion.domain}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                      {motion.roundDesignation || 'Zonal Prelims'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px]">
                      {motion.preparationType}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onSelectMotionForFixture && (
                      <button
                        onClick={() => onSelectMotionForFixture(motion.motionText, motion.domain, motion.infoSlide)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Assign to Fixture</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleStartEdit(motion)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-all"
                      title="Edit motion"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(motion.id, motion.motionText)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-all"
                      title="Delete motion"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Motion Text */}
                <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                  "{motion.motionText}"
                </h4>

                {/* Info Slide */}
                {motion.infoSlide && (
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="text-slate-700 font-semibold block text-[11px]">Adjudicator & Team Context:</strong>
                      <p className="leading-relaxed">{motion.infoSlide}</p>
                    </div>
                  </div>
                )}

                {motion.addedBy && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>Deposited by: {motion.addedBy}</span>
                    {motion.createdAt && (
                      <span>• {new Date(motion.createdAt).toLocaleDateString()}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
