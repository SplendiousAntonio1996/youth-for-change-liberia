import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Award, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Users, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Compass, 
  Info, 
  ExternalLink,
  ChevronRight,
  Flame,
  Tent,
  Landmark,
  Scale
} from 'lucide-react';
import { LndcStage } from '../types/tournament';
import { 
  DEFAULT_LNDC_CONFIG, 
  LNDC_STAGES_INFO, 
  generateCentralStage16Teams, 
  ALL_15_LIBERIAN_COUNTIES 
} from '../data/lndcTournamentRules';

interface LndcTournamentArchitectureProps {
  initialStage?: LndcStage;
  onFilterFixturesStage?: (stage: LndcStage) => void;
  onViewFixtures?: () => void;
}

const PRESET_DEFENDING_CHAMPIONS = [
  { school: 'United Dawah Ummah High School', county: 'Montserrado', year: '2023 Champion' },
  { school: 'Ganta United Methodist School (GUMS)', county: 'Nimba', year: '2022 & 2020 Champion' },
  { school: 'Cutting University High School', county: 'Bong', year: '2021 Champion' },
  { school: 'Bishop Juwle Catholic High', county: 'Grand Gedeh', year: '2019 Champion' },
  { school: 'Paynesville Seventh-day Adventist (SDA)', county: 'Montserrado', year: '2018 Champion' }
];

export const LndcTournamentArchitecture: React.FC<LndcTournamentArchitectureProps> = ({
  initialStage = 'county_prelims',
  onFilterFixturesStage,
  onViewFixtures
}) => {
  const [activeStage, setActiveStage] = useState<LndcStage>(initialStage);
  const [selectedChampionIndex, setSelectedChampionIndex] = useState(0);
  const [customSchoolName, setCustomSchoolName] = useState('');
  const [customCounty, setCustomCounty] = useState('Montserrado');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Active Defending Champion settings
  const currentDefendingSchool = isCustomMode 
    ? (customSchoolName.trim() || 'United Dawah Ummah High School') 
    : PRESET_DEFENDING_CHAMPIONS[selectedChampionIndex].school;

  const currentDefendingCounty = isCustomMode 
    ? customCounty 
    : PRESET_DEFENDING_CHAMPIONS[selectedChampionIndex].county;

  // Generate dynamic 16 teams for Central Stage based on chosen defending champion
  const central16Teams = generateCentralStage16Teams(currentDefendingSchool, currentDefendingCounty);

  const stageInfo = LNDC_STAGES_INFO[activeStage];

  const handleStageSelect = (stage: LndcStage) => {
    setActiveStage(stage);
    if (onFilterFixturesStage) {
      onFilterFixturesStage(stage);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Top Banner: LNDC Official Structure */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wide uppercase mb-3 border border-emerald-500/30">
              <Trophy className="w-3.5 h-3.5" />
              Official Forensics Competition Framework
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Liberia National Debate Championship
              <span className="text-emerald-400 font-mono text-xl sm:text-2xl font-bold">(LNDC)</span>
            </h2>
            <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
              The prestigious LNDC operates on an accredited <strong className="text-white">Three-Stage Structure</strong> designed to ensure county-wide grassroots equity, an automatic national qualification bye for the reigning champion school, a 16-team Central Tournament identified strictly by county names, and a climax featuring a Camp Third-Place match and Grand Final at an official grand venue.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {onViewFixtures && (
              <button
                onClick={onViewFixtures}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-sm"
              >
                <Layers className="w-4 h-4" />
                View Stage Fixtures
              </button>
            )}
          </div>
        </div>

        {/* 3 Stages Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8 pt-6 border-t border-slate-800">
          {/* Stage 1 */}
          <button
            onClick={() => handleStageSelect('county_prelims')}
            className={`text-left p-4 rounded-xl border transition-all relative ${
              activeStage === 'county_prelims'
                ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-md'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Stage 01
              </span>
              <span className="text-xs text-slate-400 font-medium">15 Counties</span>
            </div>
            <h3 className="font-bold text-base text-white">County Preliminary Stage</h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              High schools compete to be crowned County Champions. Defending champion receives an automatic Central Stage bye.
            </p>
            {activeStage === 'county_prelims' && (
              <div className="absolute bottom-0 left-4 right-4 h-1 bg-emerald-400 rounded-t-full" />
            )}
          </button>

          {/* Stage 2 */}
          <button
            onClick={() => handleStageSelect('central_stage')}
            className={`text-left p-4 rounded-xl border transition-all relative ${
              activeStage === 'central_stage'
                ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-md'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                Stage 02
              </span>
              <span className="text-xs text-slate-400 font-medium">16 Teams Total</span>
            </div>
            <h3 className="font-bold text-base text-white">Central Stage (Tournament)</h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              15 County Champions + Defending Champion. Teams are identified strictly by County Names on the national stage.
            </p>
            {activeStage === 'central_stage' && (
              <div className="absolute bottom-0 left-4 right-4 h-1 bg-emerald-400 rounded-t-full" />
            )}
          </button>

          {/* Stage 3 */}
          <button
            onClick={() => handleStageSelect('grand_final_third_place')}
            className={`text-left p-4 rounded-xl border transition-all relative ${
              activeStage === 'grand_final_third_place'
                ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-md'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Stage 03
              </span>
              <span className="text-xs text-slate-400 font-medium">4 Finalists</span>
            </div>
            <h3 className="font-bold text-base text-white">Grand Final & Third Place</h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              Third Place is played on the Camp; Grand Final is staged at an Official Grand Venue to crown the Champion of Liberia.
            </p>
            {activeStage === 'grand_final_third_place' && (
              <div className="absolute bottom-0 left-4 right-4 h-1 bg-emerald-400 rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* Interactive Simulation Bar: Defending Champion Rulebook Explorer */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Defending Champion Rulebook Logic</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  Double County Representation
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                When <strong className="text-slate-900">{currentDefendingSchool}</strong> ({currentDefendingCounty} County) won the championship, {currentDefendingCounty} became Champion of Liberia.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Simulate Champion:</span>
            {!isCustomMode ? (
              <select
                value={selectedChampionIndex}
                onChange={(e) => setSelectedChampionIndex(Number(e.target.value))}
                className="text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              >
                {PRESET_DEFENDING_CHAMPIONS.map((champ, idx) => (
                  <option key={idx} value={idx}>
                    {champ.school} ({champ.county})
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="School Name"
                  value={customSchoolName}
                  onChange={(e) => setCustomSchoolName(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <select
                  value={customCounty}
                  onChange={(e) => setCustomCounty(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {ALL_15_LIBERIAN_COUNTIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="text-xs text-slate-600 hover:text-slate-900 underline px-2 py-1 font-medium"
            >
              {isCustomMode ? 'Presets' : 'Custom School'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area for the Active Stage */}
      <div className="p-6 sm:p-8">
        {/* Stage 1 Detailed View */}
        {activeStage === 'county_prelims' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: The Mechanics & Rule Breakdown */}
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-950 text-base">
                        The Defending Champion Bye Exemption (Stage 1 Operational Rule)
                      </h4>
                      <p className="text-sm text-emerald-800/90 mt-1.5 leading-relaxed">
                        In Stage One, secondary schools in every county compete to become county champions. 
                        <strong> However, the reigning National Champion school ({currentDefendingSchool}) does NOT join the county preliminaries.</strong>
                      </p>
                      <div className="mt-3 bg-white/80 rounded-lg p-3.5 border border-emerald-300 text-xs text-emerald-950 space-y-1.5">
                        <div className="flex items-center gap-2 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{currentDefendingSchool} automatically joins the Central Stage (Stage 2).</span>
                        </div>
                        <div className="flex items-center gap-2 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{currentDefendingCounty} County stages preliminaries to crown a second school as its County Champion.</span>
                        </div>
                        <div className="flex items-center gap-2 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Logically, {currentDefendingCounty} County always produces <span className="underline font-bold">TWO teams</span> at the Central Stage!</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                  <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Compass className="w-4 h-4 text-slate-600" />
                    Stage 1 Nationwide Execution across all 15 Counties
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Schools are divided into geographic zones within each county. Preliminary debates utilize the official World Schools Debate Championship (WSDC) format with accredited neutral adjudicators. The winner of each county preliminary tournament earns the official badge of County Champion and qualifies for the Central Tournament.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2">
                    {ALL_15_LIBERIAN_COUNTIES.map(county => {
                      const isDefendingCounty = county.toLowerCase() === currentDefendingCounty.toLowerCase();
                      return (
                        <div 
                          key={county} 
                          className={`p-2.5 rounded-lg border text-center transition-all ${
                            isDefendingCounty 
                              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30' 
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-800">{county}</div>
                          <div className={`text-[11px] mt-0.5 font-medium ${isDefendingCounty ? 'text-amber-800 font-semibold' : 'text-slate-500'}`}>
                            {isDefendingCounty ? 'Produces 2 Teams' : 'Produces 1 Team'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Col: County Summary & Defending Breakdown */}
              <div className="space-y-4">
                <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">Stage 1 Summary</span>
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  <h4 className="font-bold text-lg text-white">County Justification Roster</h4>
                  
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Total Counties:</span>
                      <span className="font-bold text-white">15 Counties</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Standard County Qualifiers:</span>
                      <span className="font-bold text-white">14 Counties (1 team each)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Defending Champion County:</span>
                      <span className="font-bold text-emerald-400">{currentDefendingCounty} (2 teams)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Defending School Automatic Bye:</span>
                      <span className="font-bold text-amber-300">{currentDefendingSchool}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">Advancing to Central Stage:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">16 Teams Total</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleStageSelect('central_stage')}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Proceed to Central Stage (16 Teams)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    Why does the champion school get a bye?
                  </div>
                  <p className="leading-relaxed">
                    Under LNDC constitutional precedent, defending champions are evaluated at the national level. County preliminary justifications exist to crown the current year’s county champion, allowing the defending champion’s county to field both their reigning champions and their current champions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stage 2 Detailed View */}
        {activeStage === 'central_stage' && (
          <div className="space-y-6">
            {/* Stage 2 Mandatory Identification Rule Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-950 text-base">
                    County Name Identification Rule (Stage 2 Operational Mandate)
                  </h4>
                  <p className="text-sm text-blue-900 mt-1 leading-relaxed">
                    <strong>Teams are officially identified by County Names, NOT school names, at the Central Tournament.</strong> 
                    On the national stage, debaters carry the flag, identity, and prestige of their entire county.
                  </p>
                  <p className="text-xs text-blue-800 mt-2">
                    The 16 teams comprise 15 County Champions + 1 Defending Champion school. The tournament begins in the Round of 16 (8 matches) and proceeds through the Quarterfinals (4 matches) and Semifinals (2 matches).
                  </p>
                </div>
              </div>
            </div>

            {/* 16-Team Roster Grid Identified by County Names */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-600" />
                  Official 16-Team Central Tournament Bracket Lineup
                </h4>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  16 Teams (15 Counties)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {central16Teams.map((team, idx) => {
                  const isDefending = team.isDefendingChampion;
                  const isSecondDefendingCountyTeam = team.county.toLowerCase() === currentDefendingCounty.toLowerCase() && !isDefending;

                  return (
                    <div 
                      key={team.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isDefending 
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-300 ring-2 ring-amber-400/20' 
                          : isSecondDefendingCountyTeam
                            ? 'bg-blue-50/70 border-blue-300'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          Seed #{team.seed}
                        </span>
                        {isDefending ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            Defending
                          </span>
                        ) : isSecondDefendingCountyTeam ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                            County Champ
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-500">
                            County Champ
                          </span>
                        )}
                      </div>

                      {/* Official County Name Display */}
                      <div className="font-bold text-slate-900 text-base">
                        {team.displayName}
                      </div>

                      {/* Archival School Name Note */}
                      <div className="text-xs text-slate-500 mt-1 truncate" title={team.schoolName}>
                        School: {team.schoolName}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage 2 Progression Flow */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h5 className="font-bold text-slate-900 text-sm mb-3">Central Tournament Progression:</h5>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="font-mono text-xs text-slate-400">Step 1</div>
                  <div className="font-bold text-slate-800 mt-1">Round of 16</div>
                  <div className="text-xs text-slate-500 mt-0.5">8 Matches (16 Teams)</div>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="font-mono text-xs text-slate-400">Step 2</div>
                  <div className="font-bold text-slate-800 mt-1">Quarter-Finals</div>
                  <div className="text-xs text-slate-500 mt-0.5">4 Matches (8 Winners)</div>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="font-mono text-xs text-slate-400">Step 3</div>
                  <div className="font-bold text-slate-800 mt-1">Semi-Finals</div>
                  <div className="text-xs text-slate-500 mt-0.5">2 Matches (4 Winners)</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg">
                  <div className="font-mono text-xs text-emerald-600">Advances To</div>
                  <div className="font-bold text-emerald-900 mt-1">Stage 3 Finals</div>
                  <div className="text-xs text-emerald-700 mt-0.5">Grand Final & 3rd Place</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stage 3 Detailed View */}
        {activeStage === 'grand_final_third_place' && (
          <div className="space-y-6">
            {/* Grand Final & 3rd Place Venue Distinction Header */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950 text-base">
                    Stage 3: The Grand Final Stage (Two Championship Clashes, Two Distinct Venues)
                  </h4>
                  <p className="text-sm text-amber-900 mt-1 leading-relaxed">
                    The grand final stage features <strong className="text-amber-950">two schools competing for the championship</strong> and <strong className="text-amber-950">two schools competing for third place</strong>.
                  </p>
                  <p className="text-xs text-amber-800 mt-2">
                    Per Liberian tradition, the <strong>Third Place Match is played on the Camp</strong> (Central Forensics & Debate Bootcamp grounds), while the <strong>Grand Final is held at an Official Grand Venue</strong> before national dignitaries and live television cameras.
                  </p>
                </div>
              </div>
            </div>

            {/* The Two Staging Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Third Place Match (Camp) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col justify-between">
                <div className="p-5 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-800 text-xs font-bold font-mono">
                      <Tent className="w-3.5 h-3.5 text-slate-700" />
                      PLAYED ON THE CAMP
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Bronze Medal</span>
                  </div>
                  <h4 className="font-bold text-lg text-slate-900 mt-2.5">
                    LNDC Third Place Playoff
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Contested between the two semi-final runners-up
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900">Venue:</span> {DEFAULT_LNDC_CONFIG.thirdPlaceVenue}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Users className="w-4 h-4 text-slate-500 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900">Atmosphere:</span> Camp ground arena surrounded by fellow county debaters, coaches, and peer adjudicators.
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-800">Anticipated Matchup:</div>
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>Nimba Delegation</span>
                      <span className="text-slate-400 font-normal">vs</span>
                      <span>Bong Delegation</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Semifinal Runner-up 1 vs. Semifinal Runner-up 2
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-center font-medium">
                  Determines the 3rd Place National Forensics Podium
                </div>
              </div>

              {/* Card 2: Grand Final (Official Grand Venue) */}
              <div className="border-2 border-emerald-400/80 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col justify-between relative">
                <div className="p-5 border-b border-emerald-100 bg-emerald-50/50">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold font-mono">
                      <Landmark className="w-3.5 h-3.5" />
                      OFFICIAL GRAND VENUE
                    </span>
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      Gold Trophy Clash
                    </span>
                  </div>
                  <h4 className="font-bold text-lg text-emerald-950 mt-2.5">
                    LNDC National Championship Grand Final
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    Contested between the two semi-final winners to crown the Champion of Liberia
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-950">
                      <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <span className="font-semibold">Venue:</span> {DEFAULT_LNDC_CONFIG.grandFinalVenue}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-950">
                      <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <span className="font-semibold">Format:</span> Full formal parliamentary forensics before national ministry leaders, international partners, and live national broadcast.
                      </div>
                    </div>
                  </div>

                  <div className="border border-emerald-300 rounded-lg p-3 text-xs space-y-1.5 bg-emerald-50/30">
                    <div className="font-semibold text-emerald-900">National Finalists:</div>
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{currentDefendingCounty} Delegation ({currentDefendingSchool})</span>
                      <span className="text-emerald-700 font-normal">vs</span>
                      <span>Margibi Delegation (BWI)</span>
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      Winner crowned Champion of Liberia & awarded the National Jubilee Trophy
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 border-t border-emerald-100 text-xs text-emerald-800 text-center font-semibold">
                  Winner represents Liberia at the All-African & Mano River Youth Championships
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Youth For Change Liberia • National Secretariat Forensics Regulation (LNDC-2025/26)</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-slate-600">Stage 1: County • Stage 2: Central (16) • Stage 3: Grand Final & 3rd Place</span>
        </div>
      </div>
    </div>
  );
};
