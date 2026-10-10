import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  Users, School, Trophy, MapPin, 
  ArrowUpDown, Filter, ChevronRight, CheckCircle2, 
  Sparkles, Globe2, Phone, ExternalLink, BarChart3, PieChart as PieIcon, Table as TableIcon
} from 'lucide-react';
import { LIBERIA_COUNTIES } from '../data/schoolData';
import { CountyPerformance } from '../types';

export interface CountyImpactVisualizerProps {
  selectedCounty: string;
  onSelectCounty: (county: string) => void;
  onRegisterSchool?: (county: string) => void;
  onViewStandings?: () => void;
}

type MetricMode = 'youth' | 'schools' | 'titles' | 'regional';
type SortMode = 'impact' | 'alphabetical' | 'region';
type ViewMode = 'chart' | 'table';

// Regional classification for Liberia's 15 counties
export const COUNTY_REGIONS: Record<string, { region: string; color: string }> = {
  'Montserrado': { region: 'Western', color: '#065f46' }, // emerald-800
  'Bomi': { region: 'Western', color: '#047857' },
  'Grand Cape Mount': { region: 'Western', color: '#059669' },
  'Gbarpolu': { region: 'Western', color: '#10b981' },
  
  'Bong': { region: 'Central Belt', color: '#b45309' }, // amber-700
  'Margibi': { region: 'Central Belt', color: '#d97706' },
  'Grand Bassa': { region: 'Central Belt', color: '#f59e0b' },
  'Rivercess': { region: 'Central Belt', color: '#fbbf24' },
  
  'Nimba': { region: 'Northern', color: '#1e40af' }, // blue-800
  'Lofa': { region: 'Northern', color: '#3b82f6' },
  
  'Grand Gedeh': { region: 'South-Eastern', color: '#6b21a8' }, // purple-800
  'Maryland': { region: 'South-Eastern', color: '#7e22ce' },
  'Sinoe': { region: 'South-Eastern', color: '#9333ea' },
  'River Gee': { region: 'South-Eastern', color: '#a855f7' },
  'Grand Kru': { region: 'South-Eastern', color: '#c084fc' },
};

export const CountyImpactVisualizer: React.FC<CountyImpactVisualizerProps> = ({
  selectedCounty,
  onSelectCounty,
  onRegisterSchool,
  onViewStandings
}) => {
  const [metricMode, setMetricMode] = useState<MetricMode>('youth');
  const [sortMode, setSortMode] = useState<SortMode>('impact');
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [hoveredCounty, setHoveredCounty] = useState<string | null>(null);

  // Aggregated National Metrics
  const nationalStats = useMemo(() => {
    const totalYouth = LIBERIA_COUNTIES.reduce((acc, c) => acc + c.totalDebaters, 0);
    const totalSchools = LIBERIA_COUNTIES.reduce((acc, c) => acc + c.activeSchools, 0);
    const totalDebateTitles = LIBERIA_COUNTIES.reduce((acc, c) => acc + c.debateTitles, 0);
    const totalStemTitles = LIBERIA_COUNTIES.reduce((acc, c) => acc + c.stemTitles, 0);
    const countiesCount = LIBERIA_COUNTIES.length;

    return {
      totalYouth,
      totalSchools,
      totalTitles: totalDebateTitles + totalStemTitles,
      totalDebateTitles,
      totalStemTitles,
      countiesCount,
      coveragePercent: 100,
      femaleParticipationEst: '48.6%'
    };
  }, []);

  // Regional breakdown data for Pie/Donut Chart
  const regionalData = useMemo(() => {
    const map: Record<string, { name: string; value: number; schools: number; color: string; counties: string[] }> = {
      'Western': { name: 'Western Liberia', value: 0, schools: 0, color: '#065f46', counties: [] },
      'Central Belt': { name: 'Central Belt', value: 0, schools: 0, color: '#d97706', counties: [] },
      'Northern': { name: 'Northern Liberia', value: 0, schools: 0, color: '#2563eb', counties: [] },
      'South-Eastern': { name: 'South-Eastern', value: 0, schools: 0, color: '#7e22ce', counties: [] },
    };

    LIBERIA_COUNTIES.forEach(c => {
      const reg = COUNTY_REGIONS[c.county]?.region || 'Other';
      if (map[reg]) {
        map[reg].value += c.totalDebaters;
        map[reg].schools += c.activeSchools;
        map[reg].counties.push(c.county);
      }
    });

    return Object.values(map);
  }, []);

  // Process and sort chart items
  const chartData = useMemo(() => {
    const list = LIBERIA_COUNTIES.map(c => {
      const reg = COUNTY_REGIONS[c.county]?.region || 'Other';
      const color = COUNTY_REGIONS[c.county]?.color || '#065f46';
      return {
        ...c,
        totalTitles: c.debateTitles + c.stemTitles,
        region: reg,
        color
      };
    });

    if (sortMode === 'impact') {
      return [...list].sort((a, b) => {
        if (metricMode === 'youth') return b.totalDebaters - a.totalDebaters;
        if (metricMode === 'schools') return b.activeSchools - a.activeSchools;
        if (metricMode === 'titles') return b.totalTitles - a.totalTitles;
        return b.totalDebaters - a.totalDebaters;
      });
    }

    if (sortMode === 'alphabetical') {
      return [...list].sort((a, b) => a.county.localeCompare(b.county));
    }

    if (sortMode === 'region') {
      return [...list].sort((a, b) => {
        const regDiff = a.region.localeCompare(b.region);
        if (regDiff !== 0) return regDiff;
        return b.totalDebaters - a.totalDebaters;
      });
    }

    return list;
  }, [metricMode, sortMode]);

  const activeCountyData = useMemo(() => {
    return LIBERIA_COUNTIES.find(c => c.county === selectedCounty) || LIBERIA_COUNTIES[0];
  }, [selectedCounty]);

  // Custom chart tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as (typeof chartData)[0];
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl border border-emerald-500/40 shadow-2xl backdrop-blur-md text-xs max-w-xs space-y-1.5 z-50">
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
              <strong className="text-sm font-black text-white">{data.county} County</strong>
            </div>
            <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800">
              {data.region}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block">Youth Empowered</span>
              <span className="text-sm font-black text-emerald-400">{data.totalDebaters.toLocaleString()}</span>
            </div>
            <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block">Active Schools</span>
              <span className="text-sm font-black text-white">{data.activeSchools}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5">
            <span>Debate: <strong className="text-yellow-400">{data.debateTitles}</strong></span>
            <span>STEM: <strong className="text-emerald-300">{data.stemTitles}</strong></span>
            <span>Total Titles: <strong className="text-white">{data.totalTitles}</strong></span>
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-700/60 pt-1">
            Coordinator: <span className="text-slate-200 font-medium">{data.coordinator}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section 
      id="youth-impact-section"
      className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-4 bg-emerald-800 rounded-full"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Decentralized Youth Empowerment Impact</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            15 Counties. 6,720+ Young Leaders Reached.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Every county of Liberia is an active pillar in our civic debate, STEM robotics, and forensics ecosystem.
            Explore interactive metrics below tracking participating high schools, student cohorts, and national championship titles.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'chart' 
                ? 'bg-white text-emerald-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Interactive Chart</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'table' 
                ? 'bg-white text-emerald-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Full Data Table</span>
          </button>
        </div>
      </div>

      {/* High-Level Impact KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Youth Reached</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900">
            {nationalStats.totalYouth.toLocaleString()}+
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Debaters, STEM scholars, & youth</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Partner High Schools</span>
            <School className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {nationalStats.totalSchools}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Accredited secondary institutions</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Decentralization</span>
            <Globe2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800">
            15 / 15
          </div>
          <p className="text-[11px] text-emerald-700 font-bold">100% Nationwide Coverage</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">National Titles Awarded</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {nationalStats.totalTitles}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">10 Debate & 6 STEM Championship trophies</p>
        </div>
      </div>

      {/* Control Bar: Metric Selector & Sort Options */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Metric:</span>
          </span>
          <button
            onClick={() => setMetricMode('youth')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'youth'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Youth Empowered
          </button>
          <button
            onClick={() => setMetricMode('schools')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'schools'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Active Schools
          </button>
          <button
            onClick={() => setMetricMode('titles')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'titles'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Championship Titles
          </button>
          <button
            onClick={() => setMetricMode('regional')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'regional'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Regional Split
          </button>
        </div>

        {metricMode !== 'regional' && viewMode === 'chart' && (
          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-emerald-800 cursor-pointer"
            >
              <option value="impact">Highest to Lowest</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
              <option value="region">By Geopolitical Region</option>
            </select>
          </div>
        )}
      </div>

      {/* Main View Area */}
      {viewMode === 'chart' ? (
        metricMode === 'regional' ? (
          /* Regional Donut Chart View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="lg:col-span-6 h-[320px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${Number(val).toLocaleString()} young leaders`,
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      borderColor: '#059669',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                  />
                  <Pie
                    data={regionalData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={4}
                  >
                    {regionalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(val) => <span className="text-xs font-bold text-slate-700 mr-3">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-6 space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Geopolitical Zone Distribution</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Youth For Change ensures no county is left behind. Our programs bridge rural and urban high schools,
                delivering standardized coaching, debate motions, and STEM challenge materials across all 4 regions:
              </p>

              <div className="space-y-2 pt-2">
                {regionalData.map(reg => {
                  const percent = Math.round((reg.value / nationalStats.totalYouth) * 100);
                  return (
                    <div key={reg.name} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: reg.color }} />
                          <strong className="text-slate-800">{reg.name}</strong>
                          <span className="text-[11px] text-slate-400 font-medium">({reg.counties.length} counties)</span>
                        </div>
                        <div className="text-right">
                          <strong className="text-emerald-900">{reg.value.toLocaleString()}</strong>
                          <span className="text-slate-400 text-[11px] ml-1">({percent}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%`, backgroundColor: reg.color }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Active Schools: <strong className="text-slate-700">{reg.schools}</strong> • Counties: {reg.counties.join(', ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Primary Recharts Bar Chart View */
          <div className="space-y-4">
            <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-semibold">
                  {metricMode === 'youth' && 'Interactive Chart: Total Debaters & Innovators Reached per County'}
                  {metricMode === 'schools' && 'Interactive Chart: Active Participating High Schools per County'}
                  {metricMode === 'titles' && 'Interactive Chart: National Championships Won (Debate & STEM)'}
                </span>
                <span className="text-[11px] text-emerald-800 font-bold">
                  Click any bar to inspect county coordinator & registered schools
                </span>
              </div>

              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 10, left: -10, bottom: 40 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload[0] && e.activePayload[0].payload) {
                        onSelectCounty(e.activePayload[0].payload.county);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="county"
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={55}
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    {metricMode === 'titles' ? (
                      <>
                        <Bar 
                          dataKey="debateTitles" 
                          name="Debate Titles" 
                          stackId="a" 
                          fill="#b45309" 
                          radius={[0, 0, 0, 0]} 
                        />
                        <Bar 
                          dataKey="stemTitles" 
                          name="STEM Titles" 
                          stackId="a" 
                          fill="#047857" 
                          radius={[6, 6, 0, 0]} 
                        />
                      </>
                    ) : (
                      <Bar
                        dataKey={metricMode === 'youth' ? 'totalDebaters' : 'activeSchools'}
                        radius={[6, 6, 0, 0]}
                        onMouseEnter={(data) => setHoveredCounty(data.county)}
                        onMouseLeave={() => setHoveredCounty(null)}
                        cursor="pointer"
                      >
                        {chartData.map((entry) => {
                          const isSelected = entry.county === selectedCounty;
                          const isHovered = entry.county === hoveredCounty;
                          let fill = entry.color;
                          if (isSelected) fill = '#064e3b'; // High emphasis
                          else if (isHovered) fill = '#047857';

                          return (
                            <Cell 
                              key={`cell-${entry.county}`} 
                              fill={fill}
                              stroke={isSelected ? '#f59e0b' : 'transparent'}
                              strokeWidth={isSelected ? 2 : 0}
                            />
                          );
                        })}
                      </Bar>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend & Explanation */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/80 text-[11px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#065f46]" />
                    <span>Western Region</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#d97706]" />
                    <span>Central Belt</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#1e40af]" />
                    <span>Northern</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#7e22ce]" />
                    <span>South-Eastern</span>
                  </span>
                </div>
                <div className="text-slate-400">
                  Highlighted bar indicates active county selection
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        /* Full Data Table View */
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">County</th>
                <th className="py-3 px-4">Capital</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4 text-right">Youth Reached</th>
                <th className="py-3 px-4 text-right">Active Schools</th>
                <th className="py-3 px-4 text-right">Titles (🏆)</th>
                <th className="py-3 px-4">County Coordinator</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chartData.map((c, idx) => (
                <tr 
                  key={c.county}
                  onClick={() => onSelectCounty(c.county)}
                  className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                    c.county === selectedCounty ? 'bg-emerald-50/70 font-semibold' : ''
                  }`}
                >
                  <td className="py-2.5 px-4 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span>{c.county}</span>
                    {c.totalTitles > 0 && <span className="text-yellow-500">🏆</span>}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">{c.capital}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {c.region}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-black text-emerald-900">
                    {c.totalDebaters.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-800">{c.activeSchools}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-amber-700">{c.totalTitles}</td>
                  <td className="py-2.5 px-4 text-slate-600">
                    <div>{c.coordinator}</div>
                    <div className="text-[10px] text-slate-400">{c.coordinatorContact}</div>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCounty(c.county);
                      }}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-800 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Interactive County Selector Badges */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold">Quick Select County ({LIBERIA_COUNTIES.length} Total):</span>
          {onViewStandings && (
            <button
              onClick={onViewStandings}
              className="font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Full County Standings</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {LIBERIA_COUNTIES.map(c => {
            const isSelected = selectedCounty === c.county;
            return (
              <button
                key={c.county}
                id={`impact-county-pill-${c.county.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onSelectCounty(c.county)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-xs font-bold ring-2 ring-emerald-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/70'
                }`}
              >
                <span>{c.county}</span>
                {(c.debateTitles > 0 || c.stemTitles > 0) && (
                  <span className="text-[10px] text-yellow-400 font-bold">
                    🏆 {c.debateTitles + c.stemTitles}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active County Spotlight Card */}
      <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-white flex items-center justify-center font-bold shadow-xs">
              <MapPin className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900">
                  {activeCountyData.county} County
                </h3>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  {COUNTY_REGIONS[activeCountyData.county]?.region || 'Liberia'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Capital: <strong className="text-slate-700">{activeCountyData.capital}</strong> • Emblem: {activeCountyData.flagEmblem}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
            "{activeCountyData.highlight}"
          </p>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Youth Debaters</span>
              <span className="text-lg font-black text-emerald-800">{activeCountyData.totalDebaters.toLocaleString()}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Active High Schools</span>
              <span className="text-lg font-black text-slate-900">{activeCountyData.activeSchools}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Championships Won</span>
              <span className="text-lg font-black text-amber-600">
                {activeCountyData.debateTitles + activeCountyData.stemTitles}
                <span className="text-xs font-normal text-slate-400 ml-1">
                  ({activeCountyData.debateTitles}D / {activeCountyData.stemTitles}S)
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-emerald-900 text-white rounded-2xl p-5 space-y-3.5 shadow-md border border-emerald-800">
          <div className="flex items-center justify-between border-b border-emerald-800 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-yellow-300" />
              <span>County Secretariat Desk</span>
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
              Official Contact
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-emerald-200 block text-[11px]">Regional Coordinator:</span>
              <strong className="text-white text-sm font-black">{activeCountyData.coordinator}</strong>
            </div>
            <div>
              <span className="text-emerald-200 block text-[11px]">Direct WhatsApp / Phone:</span>
              <a 
                href={`tel:${activeCountyData.coordinatorContact.replace(/\s+/g, '')}`}
                className="text-yellow-300 font-mono text-xs hover:underline flex items-center gap-1 font-bold"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{activeCountyData.coordinatorContact}</span>
              </a>
            </div>
          </div>

          <button
            onClick={() => onRegisterSchool?.(activeCountyData.county)}
            className="w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Register a {activeCountyData.county} High School</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
