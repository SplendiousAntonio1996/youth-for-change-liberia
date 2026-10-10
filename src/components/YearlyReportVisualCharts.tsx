import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  Building2,
  DollarSign,
  Users,
  MapPin,
  TrendingUp,
  PieChart as PieIcon,
  BarChart2,
  CheckCircle2,
  Scale,
  Sparkles,
  ArrowUpRight,
  Filter,
  ShieldCheck
} from 'lucide-react';

interface VisualChartsProps {
  selectedYear: string;
  onYearChange?: (year: string) => void;
  showSection?: 'all' | 'schools' | 'finance';
}

// Multi-Year participation data
export const PARTICIPATION_BY_YEAR: Record<string, {
  totalSchools: number;
  totalDebaters: number;
  femaleRatio: number;
  counties: { name: string; schools: number; debaters: number; zone: string }[];
  zones: { name: string; schools: number; debaters: number; percentage: number; color: string }[];
}> = {
  '2024-25': {
    totalSchools: 173,
    totalDebaters: 6420,
    femaleRatio: 52,
    counties: [
      { name: 'Montserrado', schools: 48, debaters: 1850, zone: 'Montserrado Metro' },
      { name: 'Nimba', schools: 24, debaters: 920, zone: 'Eastern/Northern' },
      { name: 'Bong', schools: 18, debaters: 680, zone: 'Central' },
      { name: 'Margibi', schools: 16, debaters: 610, zone: 'Central' },
      { name: 'Lofa', schools: 14, debaters: 520, zone: 'Eastern/Northern' },
      { name: 'Grand Bassa', schools: 12, debaters: 440, zone: 'Southeastern' },
      { name: 'Maryland', schools: 9, debaters: 330, zone: 'Southeastern' },
      { name: 'Bomi', schools: 8, debaters: 280, zone: 'Western' },
      { name: 'Grand Cape Mount', schools: 7, debaters: 240, zone: 'Western' },
      { name: 'Gbarpolu', schools: 7, debaters: 220, zone: 'Western' },
      { name: 'Sinoe', schools: 6, debaters: 200, zone: 'Southeastern' },
      { name: 'Grand Gedeh', schools: 6, debaters: 190, zone: 'Southeastern' },
      { name: 'River Gee', schools: 4, debaters: 130, zone: 'Southeastern' },
      { name: 'Grand Kru', schools: 4, debaters: 120, zone: 'Southeastern' },
      { name: 'Rivercess', schools: 4, debaters: 110, zone: 'Southeastern' }
    ],
    zones: [
      { name: 'Montserrado Metro', schools: 48, debaters: 1850, percentage: 27.7, color: '#047857' },
      { name: 'Central (Bong/Margibi)', schools: 34, debaters: 1290, percentage: 19.7, color: '#0284c7' },
      { name: 'Eastern & Northern (Nimba/Lofa)', schools: 38, debaters: 1440, percentage: 22.0, color: '#eab308' },
      { name: 'Southeastern Basin (7 Counties)', schools: 31, debaters: 1090, percentage: 17.9, color: '#8b5cf6' },
      { name: 'Western (Bomi/Cape Mount/Gbarpolu)', schools: 22, debaters: 740, percentage: 12.7, color: '#f97316' }
    ]
  },
  '2023-24': {
    totalSchools: 142,
    totalDebaters: 5120,
    femaleRatio: 49,
    counties: [
      { name: 'Montserrado', schools: 42, debaters: 1540, zone: 'Montserrado Metro' },
      { name: 'Nimba', schools: 20, debaters: 730, zone: 'Eastern/Northern' },
      { name: 'Bong', schools: 15, debaters: 550, zone: 'Central' },
      { name: 'Margibi', schools: 13, debaters: 480, zone: 'Central' },
      { name: 'Lofa', schools: 12, debaters: 420, zone: 'Eastern/Northern' },
      { name: 'Grand Bassa', schools: 10, debaters: 360, zone: 'Southeastern' },
      { name: 'Maryland', schools: 7, debaters: 250, zone: 'Southeastern' },
      { name: 'Bomi', schools: 6, debaters: 210, zone: 'Western' },
      { name: 'Grand Cape Mount', schools: 5, debaters: 170, zone: 'Western' },
      { name: 'Gbarpolu', schools: 5, debaters: 160, zone: 'Western' },
      { name: 'Sinoe', schools: 4, debaters: 140, zone: 'Southeastern' },
      { name: 'Grand Gedeh', schools: 4, debaters: 130, zone: 'Southeastern' },
      { name: 'River Gee', schools: 3, debaters: 90, zone: 'Southeastern' },
      { name: 'Grand Kru', schools: 3, debaters: 80, zone: 'Southeastern' },
      { name: 'Rivercess', schools: 3, debaters: 80, zone: 'Southeastern' }
    ],
    zones: [
      { name: 'Montserrado Metro', schools: 42, debaters: 1540, percentage: 29.6, color: '#047857' },
      { name: 'Central (Bong/Margibi)', schools: 28, debaters: 1030, percentage: 19.7, color: '#0284c7' },
      { name: 'Eastern & Northern (Nimba/Lofa)', schools: 32, debaters: 1150, percentage: 22.5, color: '#eab308' },
      { name: 'Southeastern Basin (7 Counties)', schools: 24, debaters: 850, percentage: 16.9, color: '#8b5cf6' },
      { name: 'Western (Bomi/Cape Mount/Gbarpolu)', schools: 16, debaters: 540, percentage: 11.3, color: '#f97316' }
    ]
  },
  '2022-23': {
    totalSchools: 118,
    totalDebaters: 4250,
    femaleRatio: 45,
    counties: [
      { name: 'Montserrado', schools: 38, debaters: 1380, zone: 'Montserrado Metro' },
      { name: 'Nimba', schools: 16, debaters: 590, zone: 'Eastern/Northern' },
      { name: 'Bong', schools: 12, debaters: 440, zone: 'Central' },
      { name: 'Margibi', schools: 10, debaters: 370, zone: 'Central' },
      { name: 'Lofa', schools: 10, debaters: 360, zone: 'Eastern/Northern' },
      { name: 'Grand Bassa', schools: 8, debaters: 290, zone: 'Southeastern' },
      { name: 'Maryland', schools: 6, debaters: 210, zone: 'Southeastern' },
      { name: 'Bomi', schools: 5, debaters: 180, zone: 'Western' },
      { name: 'Grand Cape Mount', schools: 4, debaters: 140, zone: 'Western' },
      { name: 'Gbarpolu', schools: 4, debaters: 130, zone: 'Western' },
      { name: 'Sinoe', schools: 3, debaters: 100, zone: 'Southeastern' },
      { name: 'Grand Gedeh', schools: 3, debaters: 90, zone: 'Southeastern' },
      { name: 'River Gee', schools: 2, debaters: 60, zone: 'Southeastern' },
      { name: 'Grand Kru', schools: 2, debaters: 50, zone: 'Southeastern' },
      { name: 'Rivercess', schools: 2, debaters: 50, zone: 'Southeastern' }
    ],
    zones: [
      { name: 'Montserrado Metro', schools: 38, debaters: 1380, percentage: 32.2, color: '#047857' },
      { name: 'Central (Bong/Margibi)', schools: 22, debaters: 810, percentage: 18.6, color: '#0284c7' },
      { name: 'Eastern & Northern (Nimba/Lofa)', schools: 26, debaters: 950, percentage: 22.0, color: '#eab308' },
      { name: 'Southeastern Basin (7 Counties)', schools: 19, debaters: 700, percentage: 16.1, color: '#8b5cf6' },
      { name: 'Western (Bomi/Cape Mount/Gbarpolu)', schools: 13, debaters: 450, percentage: 11.0, color: '#f97316' }
    ]
  },
  '2015-25': {
    totalSchools: 173,
    totalDebaters: 25000,
    femaleRatio: 52,
    counties: [
      { name: 'Montserrado', schools: 48, debaters: 8200, zone: 'Montserrado Metro' },
      { name: 'Nimba', schools: 24, debaters: 4100, zone: 'Eastern/Northern' },
      { name: 'Bong', schools: 18, debaters: 3100, zone: 'Central' },
      { name: 'Margibi', schools: 16, debaters: 2700, zone: 'Central' },
      { name: 'Lofa', schools: 14, debaters: 2300, zone: 'Eastern/Northern' },
      { name: 'Grand Bassa', schools: 12, debaters: 1900, zone: 'Southeastern' },
      { name: 'Maryland', schools: 9, debaters: 1400, zone: 'Southeastern' },
      { name: 'Bomi', schools: 8, debaters: 1200, zone: 'Western' },
      { name: 'Grand Cape Mount', schools: 7, debaters: 1000, zone: 'Western' },
      { name: 'Gbarpolu', schools: 7, debaters: 900, zone: 'Western' },
      { name: 'Sinoe', schools: 6, debaters: 800, zone: 'Southeastern' },
      { name: 'Grand Gedeh', schools: 6, debaters: 750, zone: 'Southeastern' },
      { name: 'River Gee', schools: 4, debaters: 550, zone: 'Southeastern' },
      { name: 'Grand Kru', schools: 4, debaters: 500, zone: 'Southeastern' },
      { name: 'Rivercess', schools: 4, debaters: 480, zone: 'Southeastern' }
    ],
    zones: [
      { name: 'Montserrado Metro', schools: 48, debaters: 8200, percentage: 27.7, color: '#047857' },
      { name: 'Central (Bong/Margibi)', schools: 34, debaters: 5800, percentage: 19.7, color: '#0284c7' },
      { name: 'Eastern & Northern (Nimba/Lofa)', schools: 38, debaters: 6400, percentage: 22.0, color: '#eab308' },
      { name: 'Southeastern Basin (7 Counties)', schools: 31, debaters: 5100, percentage: 17.9, color: '#8b5cf6' },
      { name: 'Western (Bomi/Cape Mount/Gbarpolu)', schools: 22, debaters: 3100, percentage: 12.7, color: '#f97316' }
    ]
  }
};

// Multi-Year budget & spending data
export const BUDGET_BY_YEAR: Record<string, {
  totalAllocatedUSD: number;
  totalSpentUSD: number;
  executionRate: number;
  inflows: { source: string; amountUSD: number; percentage: number; color: string }[];
  categories: { name: string; shortName: string; allocatedUSD: number; spentUSD: number; color: string }[];
}> = {
  '2024-25': {
    totalAllocatedUSD: 154000,
    totalSpentUSD: 148500,
    executionRate: 96.4,
    inflows: [
      { source: 'Bilateral & Institutional Grants (USAID/MOE)', amountUSD: 85000, percentage: 55.8, color: '#047857' },
      { source: 'Corporate CSR Sponsorship (Orange Foundation)', amountUSD: 38000, percentage: 24.9, color: '#f97316' },
      { source: 'Diaspora & Private Benefactors', amountUSD: 24400, percentage: 16.0, color: '#eab308' },
      { source: 'Public Online Micro-Donations', amountUSD: 5000, percentage: 3.3, color: '#0284c7' }
    ],
    categories: [
      { name: 'Championship Stage & Audio Engineering Logistics', shortName: 'Stage & Logistics', allocatedUSD: 39000, spentUSD: 38200, color: '#047857' },
      { name: 'Rural School Bus Transportation & Lodging', shortName: 'Bus Transport & Lodging', allocatedUSD: 33500, spentUSD: 32400, color: '#0284c7' },
      { name: 'STEM Innovation Micro-Grants & Hardware Kits', shortName: 'STEM Hardware Grants', allocatedUSD: 25500, spentUSD: 24800, color: '#8b5cf6' },
      { name: 'Student University Scholarships & Best Speaker Grants', shortName: 'University Scholarships', allocatedUSD: 19000, spentUSD: 18600, color: '#eab308' },
      { name: 'Adjudicator & Teacher-Coach Training Masterclasses', shortName: 'Judge & Coach Training', allocatedUSD: 14500, spentUSD: 14100, color: '#10b981' },
      { name: 'WSDC Rulebooks, Research Dossiers, Trophies & Medals', shortName: 'Rulebooks & Trophies', allocatedUSD: 12000, spentUSD: 11400, color: '#f97316' },
      { name: 'Secretariat Operations, Independent Audit & M&E Governance', shortName: 'Audit & Governance', allocatedUSD: 9500, spentUSD: 9000, color: '#64748b' }
    ]
  },
  '2023-24': {
    totalAllocatedUSD: 132000,
    totalSpentUSD: 128800,
    executionRate: 97.6,
    inflows: [
      { source: 'Bilateral & Institutional Grants', amountUSD: 72000, percentage: 54.5, color: '#047857' },
      { source: 'Corporate CSR Sponsorship', amountUSD: 32000, percentage: 24.2, color: '#f97316' },
      { source: 'Diaspora & Private Benefactors', amountUSD: 24000, percentage: 18.2, color: '#eab308' },
      { source: 'Public Online Micro-Donations', amountUSD: 4000, percentage: 3.1, color: '#0284c7' }
    ],
    categories: [
      { name: 'Championship Stage & Audio Engineering Logistics', shortName: 'Stage & Logistics', allocatedUSD: 34000, spentUSD: 33500, color: '#047857' },
      { name: 'Rural School Bus Transportation & Lodging', shortName: 'Bus Transport & Lodging', allocatedUSD: 29000, spentUSD: 28200, color: '#0284c7' },
      { name: 'STEM Innovation Micro-Grants & Hardware Kits', shortName: 'STEM Hardware Grants', allocatedUSD: 21000, spentUSD: 20400, color: '#8b5cf6' },
      { name: 'Student University Scholarships & Best Speaker Grants', shortName: 'University Scholarships', allocatedUSD: 16000, spentUSD: 15800, color: '#eab308' },
      { name: 'Adjudicator & Teacher-Coach Training Masterclasses', shortName: 'Judge & Coach Training', allocatedUSD: 13000, spentUSD: 12600, color: '#10b981' },
      { name: 'WSDC Rulebooks, Research Dossiers, Trophies & Medals', shortName: 'Rulebooks & Trophies', allocatedUSD: 10500, spentUSD: 10100, color: '#f97316' },
      { name: 'Secretariat Operations, Independent Audit & M&E Governance', shortName: 'Audit & Governance', allocatedUSD: 8500, spentUSD: 8200, color: '#64748b' }
    ]
  },
  '2022-23': {
    totalAllocatedUSD: 115000,
    totalSpentUSD: 112400,
    executionRate: 97.7,
    inflows: [
      { source: 'Bilateral & Institutional Grants', amountUSD: 62000, percentage: 53.9, color: '#047857' },
      { source: 'Corporate CSR Sponsorship', amountUSD: 28000, percentage: 24.3, color: '#f97316' },
      { source: 'Diaspora & Private Benefactors', amountUSD: 22000, percentage: 19.1, color: '#eab308' },
      { source: 'Public Online Micro-Donations', amountUSD: 3000, percentage: 2.7, color: '#0284c7' }
    ],
    categories: [
      { name: 'Championship Stage & Audio Engineering Logistics', shortName: 'Stage & Logistics', allocatedUSD: 30000, spentUSD: 29500, color: '#047857' },
      { name: 'Rural School Bus Transportation & Lodging', shortName: 'Bus Transport & Lodging', allocatedUSD: 25000, spentUSD: 24400, color: '#0284c7' },
      { name: 'STEM Innovation Micro-Grants & Hardware Kits', shortName: 'STEM Hardware Grants', allocatedUSD: 18000, spentUSD: 17600, color: '#8b5cf6' },
      { name: 'Student University Scholarships & Best Speaker Grants', shortName: 'University Scholarships', allocatedUSD: 14000, spentUSD: 13900, color: '#eab308' },
      { name: 'Adjudicator & Teacher-Coach Training Masterclasses', shortName: 'Judge & Coach Training', allocatedUSD: 11500, spentUSD: 11100, color: '#10b981' },
      { name: 'WSDC Rulebooks, Research Dossiers, Trophies & Medals', shortName: 'Rulebooks & Trophies', allocatedUSD: 9000, spentUSD: 8700, color: '#f97316' },
      { name: 'Secretariat Operations, Independent Audit & M&E Governance', shortName: 'Audit & Governance', allocatedUSD: 7500, spentUSD: 7200, color: '#64748b' }
    ]
  },
  '2015-25': {
    totalAllocatedUSD: 850000,
    totalSpentUSD: 826000,
    executionRate: 97.2,
    inflows: [
      { source: 'Bilateral & Institutional Grants', amountUSD: 460000, percentage: 54.1, color: '#047857' },
      { source: 'Corporate CSR Sponsorship', amountUSD: 210000, percentage: 24.7, color: '#f97316' },
      { source: 'Diaspora & Private Benefactors', amountUSD: 156000, percentage: 18.4, color: '#eab308' },
      { source: 'Public Online Micro-Donations', amountUSD: 24000, percentage: 2.8, color: '#0284c7' }
    ],
    categories: [
      { name: 'Championship Stage & Audio Engineering Logistics', shortName: 'Stage & Logistics', allocatedUSD: 215000, spentUSD: 210000, color: '#047857' },
      { name: 'Rural School Bus Transportation & Lodging', shortName: 'Bus Transport & Lodging', allocatedUSD: 185000, spentUSD: 180000, color: '#0284c7' },
      { name: 'STEM Innovation Micro-Grants & Hardware Kits', shortName: 'STEM Hardware Grants', allocatedUSD: 140000, spentUSD: 136000, color: '#8b5cf6' },
      { name: 'Student University Scholarships & Best Speaker Grants', shortName: 'University Scholarships', allocatedUSD: 105000, spentUSD: 102000, color: '#eab308' },
      { name: 'Adjudicator & Teacher-Coach Training Masterclasses', shortName: 'Judge & Coach Training', allocatedUSD: 80000, spentUSD: 78000, color: '#10b981' },
      { name: 'WSDC Rulebooks, Research Dossiers, Trophies & Medals', shortName: 'Rulebooks & Trophies', allocatedUSD: 70000, spentUSD: 67000, color: '#f97316' },
      { name: 'Secretariat Operations, Independent Audit & M&E Governance', shortName: 'Audit & Governance', allocatedUSD: 55000, spentUSD: 53000, color: '#64748b' }
    ]
  }
};

// Longitudinal Decennial growth trajectory dataset
export const LONGITUDINAL_TRENDS = [
  { year: '2015', schools: 16, debaters: 480, budgetUSD: 22000, femaleRatio: 28 },
  { year: '2017', schools: 38, debaters: 1200, budgetUSD: 45000, femaleRatio: 34 },
  { year: '2019', schools: 64, debaters: 2100, budgetUSD: 68000, femaleRatio: 41 },
  { year: '2021', schools: 96, debaters: 3450, budgetUSD: 95000, femaleRatio: 44 },
  { year: '2023', schools: 142, debaters: 5120, budgetUSD: 128800, femaleRatio: 49 },
  { year: '2025', schools: 173, debaters: 6420, budgetUSD: 148500, femaleRatio: 52 }
];

export const YearlyReportVisualCharts: React.FC<VisualChartsProps> = ({
  selectedYear,
  onYearChange,
  showSection = 'all'
}) => {
  const [schoolChartView, setSchoolChartView] = useState<'county' | 'zone' | 'debaters'>('county');
  const [financeChartView, setFinanceChartView] = useState<'comparison' | 'share' | 'inflows'>('comparison');

  const partData = useMemo(() => {
    return PARTICIPATION_BY_YEAR[selectedYear] || PARTICIPATION_BY_YEAR['2024-25'];
  }, [selectedYear]);

  const budgetData = useMemo(() => {
    return BUDGET_BY_YEAR[selectedYear] || BUDGET_BY_YEAR['2024-25'];
  }, [selectedYear]);

  // Custom tooltips
  const CurrencyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-3 text-xs text-white shadow-xl">
          <div className="font-bold text-emerald-300 mb-1">{label}</div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 font-mono text-[11px]">
              <span className="text-slate-300" style={{ color: entry.color || entry.fill }}>
                {entry.name}:
              </span>
              <span className="font-black text-white">
                ${Number(entry.value).toLocaleString()} USD
              </span>
            </div>
          ))}
          {payload.length >= 2 && (
            <div className="mt-1 pt-1 border-t border-slate-700/60 text-[10px] text-slate-400 flex justify-between">
              <span>Variance:</span>
              <span className="font-bold text-emerald-400">
                ${Math.abs(Number(payload[0].value) - Number(payload[1].value)).toLocaleString()} USD
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const SchoolTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-blue-500/40 rounded-xl p-3 text-xs text-white shadow-xl">
          <div className="font-bold text-blue-300 mb-1">{label} County</div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-slate-300">{entry.name}:</span>
              <span className="font-black font-mono text-yellow-300">
                {entry.value} {entry.name === 'Schools' ? 'Institutions' : 'Debaters'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900 border border-yellow-400/40 rounded-xl p-3 text-xs text-white shadow-xl">
          <div className="font-bold text-yellow-300 mb-0.5">{data.name}</div>
          <div className="text-[11px] font-mono text-slate-200">
            {typeof data.value === 'number' && data.value > 1000 ? `$${data.value.toLocaleString()} USD` : `${data.value} Schools`}
          </div>
          {data.payload?.percentage && (
            <div className="text-[10px] font-bold text-emerald-400 mt-0.5">
              Share: {data.payload.percentage}%
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">

      {/* ========================================================================= */}
      {/* 1. SCHOOL PARTICIPATION VISUAL SUMMARY (RECHARTS) */}
      {/* ========================================================================= */}
      {(showSection === 'all' || showSection === 'schools') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black">
                <Building2 className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>School Participation &amp; Geographic Distribution</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    {selectedYear}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visual breakdown of {partData.totalSchools} accredited secondary schools and {partData.totalDebaters.toLocaleString()} debaters across Liberia's 15 counties.
                </p>
              </div>
            </div>

            {/* View Switcher Controls */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setSchoolChartView('county')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  schoolChartView === 'county' 
                    ? 'bg-white text-blue-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>County Bar</span>
              </button>

              <button
                type="button"
                onClick={() => setSchoolChartView('zone')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  schoolChartView === 'zone' 
                    ? 'bg-white text-blue-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PieIcon className="w-3.5 h-3.5" />
                <span>Regional Donut</span>
              </button>

              <button
                type="button"
                onClick={() => setSchoolChartView('debaters')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  schoolChartView === 'debaters' 
                    ? 'bg-white text-blue-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Debater Roster</span>
              </button>
            </div>
          </div>

          {/* KPI Snapshot Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Total Active Schools</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{partData.totalSchools} Institutions</div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">&#10003; 100% County Coverage</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Debater Roster</div>
              <div className="text-xl font-black text-blue-900 mt-0.5">{partData.totalDebaters.toLocaleString()} Orators</div>
              <div className="text-[10px] text-slate-500 mt-0.5">WSDC-trained students</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Female Parity</div>
              <div className="text-xl font-black text-purple-900 mt-0.5">{partData.femaleRatio}% Female</div>
              <div className="text-[10px] text-purple-700 font-semibold mt-0.5">Gender balance achieved</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Target Zone Equity</div>
              <div className="text-xl font-black text-amber-900 mt-0.5">5 Zonal Hubs</div>
              <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Rural travel subsidized</div>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="pt-2">
            {schoolChartView === 'county' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                  <span>Accredited High Schools by County (All 15 Counties)</span>
                  <span className="text-[11px] text-blue-700 font-normal">Hover bars to view exact counts</span>
                </div>
                <div className="w-full h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={partData.counties}
                      margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={55}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip content={<SchoolTooltip />} />
                      <Bar dataKey="schools" name="Schools" radius={[6, 6, 0, 0]}>
                        {partData.counties.map((entry, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={
                              entry.zone === 'Montserrado Metro'
                                ? '#047857'
                                : entry.zone === 'Central'
                                ? '#0284c7'
                                : entry.zone === 'Eastern/Northern'
                                ? '#eab308'
                                : entry.zone === 'Western'
                                ? '#f97316'
                                : '#8b5cf6'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Zone Color Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#047857]"></span> Montserrado Metro</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#0284c7]"></span> Central (Bong/Margibi)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#eab308]"></span> Eastern/Northern (Nimba/Lofa)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#8b5cf6]"></span> Southeastern Basin</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#f97316]"></span> Western Counties</span>
                </div>
              </div>
            )}

            {schoolChartView === 'zone' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={partData.zones}
                        dataKey="schools"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {partData.zones.map((entry, idx) => (
                          <Cell key={`zone-cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Geographic Balance Across 5 Zonal Leagues:
                  </div>
                  <div className="space-y-2">
                    {partData.zones.map((zone, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-md shrink-0" style={{ backgroundColor: zone.color }}></span>
                          <span className="font-bold text-slate-900">{zone.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black font-mono text-slate-900">{zone.schools} Schools</span>
                          <span className="text-[10px] text-slate-500 ml-2">({zone.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-500 italic">
                    Ensuring that 72% of participating schools represent rural counties outside Monrovia.
                  </div>
                </div>
              </div>
            )}

            {schoolChartView === 'debaters' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                  <span>Student Debaters Trained &amp; Rostered by County</span>
                  <span className="text-[11px] text-blue-700 font-mono">Total: {partData.totalDebaters.toLocaleString()}</span>
                </div>
                <div className="w-full h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={partData.counties}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 10, fill: '#475569' }}
                        width={90}
                      />
                      <Tooltip content={<SchoolTooltip />} />
                      <Bar dataKey="debaters" name="Debaters" fill="#0284c7" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BUDGET SPENDING & ALLOCATION VISUAL SUMMARY (RECHARTS) */}
      {/* ========================================================================= */}
      {(showSection === 'all' || showSection === 'finance') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                <DollarSign className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>Annual Operating Budget vs. Actual Expenditures</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {selectedYear}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visual accountability of budget allocation ($ {budgetData.totalAllocatedUSD.toLocaleString()} USD) vs actual money spent ($ {budgetData.totalSpentUSD.toLocaleString()} USD).
                </p>
              </div>
            </div>

            {/* View Switcher Controls */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFinanceChartView('comparison')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  financeChartView === 'comparison' 
                    ? 'bg-white text-emerald-950 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Budget vs. Spent</span>
              </button>

              <button
                type="button"
                onClick={() => setFinanceChartView('share')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  financeChartView === 'share' 
                    ? 'bg-white text-emerald-950 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PieIcon className="w-3.5 h-3.5" />
                <span>Category Share</span>
              </button>

              <button
                type="button"
                onClick={() => setFinanceChartView('inflows')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  financeChartView === 'inflows' 
                    ? 'bg-white text-emerald-950 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Inflows / Donors</span>
              </button>
            </div>
          </div>

          {/* KPI Snapshot Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Approved Budget</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                ${budgetData.totalAllocatedUSD.toLocaleString()} USD
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Institutional Ceiling</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Actual Money Spent</div>
              <div className="text-xl font-black text-emerald-800 mt-0.5">
                ${budgetData.totalSpentUSD.toLocaleString()} USD
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">&#10003; 100% Vouched &amp; Audited</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Execution Rate</div>
              <div className="text-xl font-black text-blue-900 mt-0.5">
                {budgetData.executionRate}%
              </div>
              <div className="text-[10px] text-blue-700 font-semibold mt-0.5">Strict Fiscal Discipline</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Carried Net Reserve</div>
              <div className="text-xl font-black text-amber-900 mt-0.5">
                +${(budgetData.totalAllocatedUSD - budgetData.totalSpentUSD).toLocaleString()} USD
              </div>
              <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Dedicated to Transit Fund</div>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="pt-2">
            {financeChartView === 'comparison' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                  <span>Side-by-Side: Approved Budget Allocation vs. Actual Spending (USD)</span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 font-bold text-slate-600">
                      <span className="w-3 h-3 rounded-xs bg-slate-400"></span> Allocated Budget
                    </span>
                    <span className="flex items-center gap-1 font-bold text-emerald-800">
                      <span className="w-3 h-3 rounded-xs bg-emerald-700"></span> Actual Spent
                    </span>
                  </div>
                </div>

                <div className="w-full h-80 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={budgetData.categories}
                      margin={{ top: 10, right: 10, left: 10, bottom: 65 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="shortName"
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                        height={70}
                        tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(v) => `$${v / 1000}k`}
                      />
                      <Tooltip content={<CurrencyTooltip />} />
                      <Bar dataKey="allocatedUSD" name="Allocated Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="spentUSD" name="Actual Spent" fill="#047857" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {financeChartView === 'share' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="w-full h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgetData.categories}
                        dataKey="spentUSD"
                        nameKey="shortName"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {budgetData.categories.map((entry, idx) => (
                          <Cell key={`spend-pie-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CurrencyTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    Expenditure Distribution by Program Pillar:
                  </div>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {budgetData.categories.map((cat, idx) => {
                      const pct = ((cat.spentUSD / budgetData.totalSpentUSD) * 100).toFixed(1);
                      return (
                        <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: cat.color }}></span>
                            <span className="font-bold text-slate-900 truncate text-[11px]">{cat.shortName}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-slate-900">${cat.spentUSD.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500 ml-1.5">({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {financeChartView === 'inflows' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgetData.inflows}
                        dataKey="amountUSD"
                        nameKey="source"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                      >
                        {budgetData.inflows.map((entry, idx) => (
                          <Cell key={`inflow-cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CurrencyTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Institutional Revenue Inflows &amp; Donor Composition:
                  </div>
                  <div className="space-y-2">
                    {budgetData.inflows.map((inflow, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="w-3.5 h-3.5 rounded-md shrink-0" style={{ backgroundColor: inflow.color }}></span>
                          <span className="font-bold text-slate-900 text-[11px] truncate">{inflow.source}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black font-mono text-emerald-900">${inflow.amountUSD.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-500 ml-1.5 font-bold">({inflow.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-emerald-900 font-medium">
                    &#10003; 100% of donor funding covenants met with zero unvouched variances.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MULTI-YEAR LONGITUDINAL PROGRESSION (DECENNIAL TRAJECTORY) */}
      {/* ========================================================================= */}
      {selectedYear === '2015-25' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <TrendingUp className="w-5 h-5 text-emerald-700" />
            <div>
              <h4 className="font-black text-slate-900 text-sm sm:text-base">
                10-Year Decennial Impact Trajectory (2015 – 2025)
              </h4>
              <p className="text-xs text-slate-500">
                Longitudinal progression of participating secondary schools and program budget scale.
              </p>
            </div>
          </div>

          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={LONGITUDINAL_TRENDS} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="schoolsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area yAxisId="left" type="monotone" dataKey="schools" name="Active Schools" stroke="#047857" strokeWidth={2} fillOpacity={1} fill="url(#schoolsGrad)" />
                <Line yAxisId="right" type="monotone" dataKey="budgetUSD" name="Annual Budget ($ USD)" stroke="#eab308" strokeWidth={2.5} dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};
