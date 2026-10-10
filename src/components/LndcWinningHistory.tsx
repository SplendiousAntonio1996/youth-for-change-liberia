import React, { useState } from 'react';
import { Trophy, Award, Search, ArrowRight, Star, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { LNDC_OFFICIAL_WINNING_HISTORY } from '../data/lndcWinningHistoryData';
import { DebateSubTab } from '../types';

interface LndcWinningHistoryProps {
  onSelectEdition: (editionKey: DebateSubTab) => void;
}

export const LndcWinningHistory: React.FC<LndcWinningHistoryProps> = ({ onSelectEdition }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountyFilter, setSelectedCountyFilter] = useState('All');
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards');

  const filteredHistory = LNDC_OFFICIAL_WINNING_HISTORY.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      item.year.includes(term) ||
      item.champion.toLowerCase().includes(term) ||
      item.championFull.toLowerCase().includes(term) ||
      item.runnerUp.toLowerCase().includes(term) ||
      item.grandFinalMatchup.toLowerCase().includes(term) ||
      (item.mvp && item.mvp.toLowerCase().includes(term)) ||
      (item.mes && item.mes.toLowerCase().includes(term));

    const matchesCounty = 
      selectedCountyFilter === 'All' || 
      item.championCounty === selectedCountyFilter ||
      item.runnerUpCounty === selectedCountyFilter;

    return matchesSearch && matchesCounty;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-6 p-6 sm:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
            <Trophy className="w-3.5 h-3.5 fill-emerald-800 text-emerald-800" />
            <span>Accredited LNDC Archival Ledger</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Winning History of the Liberia National Debate Championship (LNDC)
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Official record of high schools that made it to the Grand Final, crowned national champions, and individual tournament MVP & MES honorees from 2015 to 2023.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-center shrink-0">
          <button
            onClick={() => setViewLayout('cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewLayout === 'cards' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dossier Cards
          </button>
          <button
            onClick={() => setViewLayout('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewLayout === 'table' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chronological Ledger
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search champion, finalist, year, MVP (e.g. Martin Forkpah, GUMS, Bishop Juwle)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedCountyFilter}
            onChange={(e) => setSelectedCountyFilter(e.target.value)}
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all cursor-pointer"
          >
            <option value="All">All County Delegations</option>
            <option value="Montserrado">Montserrado County</option>
            <option value="Nimba">Nimba County</option>
            <option value="Grand Gedeh">Grand Gedeh County</option>
            <option value="Bong">Bong County</option>
          </select>
        </div>
      </div>

      {/* Cards View */}
      {viewLayout === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHistory.map((item) => {
            const editionKey = item.year as DebateSubTab;
            return (
              <div
                key={item.year}
                className="bg-slate-50/70 rounded-2xl border border-slate-200 p-5 space-y-4 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Year & Badge */}
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black bg-emerald-800 text-yellow-300 px-2.5 py-1 rounded-md shadow-2xs">
                        {item.year} LNDC
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        Grand Final Record
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                      {item.championCounty} County
                    </span>
                  </div>

                  {/* Grand Final Matchup */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Team that made it to the Grand Final:
                    </span>
                    <div className="font-bold text-slate-800 text-xs sm:text-sm bg-white p-2.5 rounded-xl border border-slate-200">
                      {item.grandFinalMatchup}
                    </div>
                  </div>

                  {/* Champion Result */}
                  <div className="bg-gradient-to-r from-amber-50 to-emerald-50 p-3 rounded-xl border border-amber-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 uppercase tracking-wide">
                      <Trophy className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                      <span>Champion:</span>
                    </div>
                    <div className="font-black text-slate-900 text-sm">
                      {item.champion}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Representing: <strong className="text-slate-800">{item.championCounty} County</strong>
                    </div>
                  </div>

                  {/* Runner-Up */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">1st Runner-Up:</span>{' '}
                    <strong className="text-slate-800">{item.runnerUp}</strong>
                  </div>

                  {/* Awards / MVP if present */}
                  {item.mvp && (
                    <div className="bg-emerald-900 text-emerald-50 p-2.5 rounded-xl text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-yellow-300 text-[11px]">
                        <Star className="w-3 h-3 fill-yellow-300" />
                        <span>Individual Laurels:</span>
                      </div>
                      <div className="text-[11px]">
                        <strong>MVP:</strong> {item.mvp} ({item.mvpSchool})
                      </div>
                      {item.mes && (
                        <div className="text-[11px]">
                          <strong>MES:</strong> {item.mes} ({item.mesSchool})
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Inspect Edition Action */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectEdition(editionKey);
                    const el = document.getElementById(`debate-nav-btn-${editionKey}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="w-full mt-3 py-2 px-3 bg-white hover:bg-emerald-800 text-slate-800 hover:text-white rounded-xl border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View {item.year} Tournament Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Ledger View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Year</th>
                  <th className="py-3.5 px-4">Teams that made it to the Grand Final</th>
                  <th className="py-3.5 px-4">Champion</th>
                  <th className="py-3.5 px-4">Runner-Up</th>
                  <th className="py-3.5 px-4">Awards & Individual Laurels</th>
                  <th className="py-3.5 px-4 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredHistory.map((item) => (
                  <tr key={item.year} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-black">
                      <span className="inline-block bg-emerald-800 text-yellow-300 px-2.5 py-1 rounded text-xs">
                        {item.year}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                      {item.grandFinalMatchup}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-950">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 fill-yellow-400 text-amber-600 shrink-0" />
                        <span>{item.champion}</span>
                      </div>
                      <span className="text-[11px] font-normal text-slate-500 block">
                        {item.championCounty} County
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {item.runnerUp}
                      <span className="text-[11px] text-slate-400 block">
                        {item.runnerUpCounty} County
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-600 max-w-xs">
                      {item.awards}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectEdition(item.year as DebateSubTab)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-800 hover:text-white text-slate-800 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-900 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Complete 2015–2023 National Winning History synchronized with official Youth For Change records.</span>
        </div>
        <div className="text-[11px] text-emerald-800 font-medium">
          Source: National Debate Secretariat Archives
        </div>
      </div>
    </div>
  );
};
