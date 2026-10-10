import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Trophy, 
  Filter, 
  X, 
  RotateCcw, 
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Info,
  CalendarDays,
  BellRing
} from 'lucide-react';
import { TournamentFixture } from '../../types/tournament';

export interface FixtureDateCalendarFilterProps {
  fixtures: TournamentFixture[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  gameStatusFilter: 'all' | 'completed_only' | 'scheduled_only';
  onChangeGameStatusFilter: (status: 'all' | 'completed_only' | 'scheduled_only') => void;
  className?: string;
}

interface DayMatchesSummary {
  total: number;
  completed: number;
  scheduled: number;
  fixtures: TournamentFixture[];
}

export const FixtureDateCalendarFilter: React.FC<FixtureDateCalendarFilterProps> = ({
  fixtures,
  selectedDate,
  onSelectDate,
  gameStatusFilter,
  onChangeGameStatusFilter,
  className = ''
}) => {
  const [isCalendarExpanded, setIsCalendarExpanded] = useState<boolean>(true);
  const [monthTransitionDirection, setMonthTransitionDirection] = useState<1 | -1>(1);

  // Group fixtures by matchDate
  const dateSummaries = useMemo(() => {
    const map = new Map<string, DayMatchesSummary>();
    fixtures.forEach(fix => {
      if (!fix.matchDate) return;
      const existing = map.get(fix.matchDate) || { total: 0, completed: 0, scheduled: 0, fixtures: [] };
      existing.total += 1;
      if (fix.status === 'completed') {
        existing.completed += 1;
      } else {
        existing.scheduled += 1;
      }
      existing.fixtures.push(fix);
      map.set(fix.matchDate, existing);
    });
    return map;
  }, [fixtures]);

  // All distinct tournament dates sorted chronologically
  const allGameDates = useMemo(() => {
    return Array.from(dateSummaries.keys()).sort();
  }, [dateSummaries]);

  // Determine initial calendar month based on selectedDate or first game date
  const defaultInitialDate = useMemo(() => {
    if (selectedDate && selectedDate.includes('-')) {
      const [y, m] = selectedDate.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) return { year: y, month: m - 1 };
    }
    if (allGameDates.length > 0) {
      const first = allGameDates[0];
      const [y, m] = first.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) return { year: y, month: m - 1 };
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  }, [selectedDate, allGameDates]);

  const [currentYear, setCurrentYear] = useState<number>(defaultInitialDate.year);
  const [currentMonth, setCurrentMonth] = useState<number>(defaultInitialDate.month);

  // Synchronize month view if selectedDate changes from outside
  useEffect(() => {
    if (selectedDate && selectedDate.includes('-')) {
      const [y, m] = selectedDate.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        setCurrentYear(y);
        setCurrentMonth(m - 1);
      }
    }
  }, [selectedDate]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setMonthTransitionDirection(-1);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    setMonthTransitionDirection(1);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setMonthTransitionDirection(today.getMonth() > currentMonth ? 1 : -1);
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    const yStr = today.getFullYear();
    const mStr = String(today.getMonth() + 1).padStart(2, '0');
    const dStr = String(today.getDate()).padStart(2, '0');
    onSelectDate(`${yStr}-${mStr}-${dStr}`);
  };

  // Build days matrix for the displayed month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 6 = Sat
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      summary?: DayMatchesSummary;
    }> = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        summary: dateSummaries.get(dateStr)
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        summary: dateSummaries.get(dateStr)
      });
    }

    // Next month padding to complete 7-column rows (up to 35 or 42 cells)
    const remainder = days.length % 7;
    if (remainder !== 0) {
      const daysToAdd = 7 - remainder;
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      for (let n = 1; n <= daysToAdd; n++) {
        const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
        days.push({
          dateStr,
          dayNumber: n,
          isCurrentMonth: false,
          summary: dateSummaries.get(dateStr)
        });
      }
    }

    return days;
  }, [currentYear, currentMonth, dateSummaries]);

  // Current month label
  const monthName = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }, [currentYear, currentMonth]);

  // Selected date statistics
  const selectedDateSummary = selectedDate ? dateSummaries.get(selectedDate) : null;

  // Format friendly date
  const formatFriendlyDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Step to previous / next game date in list
  const currentSelectedDateIndex = selectedDate ? allGameDates.indexOf(selectedDate) : -1;

  const handleStepGameDate = (direction: 'prev' | 'next') => {
    if (allGameDates.length === 0) return;
    if (currentSelectedDateIndex === -1) {
      onSelectDate(direction === 'prev' ? allGameDates[allGameDates.length - 1] : allGameDates[0]);
      return;
    }
    const newIdx = direction === 'prev' 
      ? Math.max(0, currentSelectedDateIndex - 1)
      : Math.min(allGameDates.length - 1, currentSelectedDateIndex + 1);
    onSelectDate(allGameDates[newIdx]);
  };

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all ${className}`}>
      {/* Calendar Header Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-400/30">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Interactive Game Day Calendar & Results Filter</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>Filter Fixtures by Any Date</span>
            {selectedDate && (
              <span className="text-xs bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full shadow-xs">
                Active Filter: {formatFriendlyDate(selectedDate)}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl">
            Click any day on the calendar or select a date to verify if matches were played, inspect final scores and speaker ballots, or view scheduled upcoming face-offs.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Quick Date Picker Input */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white">
            <CalendarDays className="w-4 h-4 text-emerald-400 shrink-0" />
            <input
              type="date"
              value={selectedDate || ''}
              onChange={(e) => onSelectDate(e.target.value || null)}
              className="bg-transparent text-white text-xs font-bold focus:outline-hidden cursor-pointer color-scheme-dark"
              title="Pick any specific calendar date to filter"
            />
          </div>

          {selectedDate && (
            <button
              type="button"
              onClick={() => onSelectDate(null)}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/40 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              title="Clear date filter to show all tournament dates"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Date</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCalendarExpanded(prev => !prev)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>{isCalendarExpanded ? 'Collapse Calendar' : 'Expand Calendar View'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Calendar Body */}
      {isCalendarExpanded && (
        <div className="p-4 sm:p-5 space-y-5 bg-slate-50/50">
          {/* Calendar Month Navigation & Month Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="min-w-[170px] text-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.h4
                    key={`${currentYear}-${currentMonth}`}
                    initial={{ opacity: 0, y: monthTransitionDirection > 0 ? 8 : -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: monthTransitionDirection > 0 ? -8 : 8 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="font-black text-sm sm:text-base text-slate-900"
                  >
                    {monthName}
                  </motion.h4>
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Month / Tournament Period Jump */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleJumpToToday}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition-colors"
              >
                Today
              </button>

              {allGameDates.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectDate(allGameDates[0])}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold cursor-pointer transition-colors"
                >
                  First Game Day ({formatFriendlyDate(allGameDates[0])})
                </button>
              )}

              {/* Legend with Highlight indicators */}
              <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-500 pl-3 border-l border-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                  <span>Results Certified</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse inline-block ring-2 ring-amber-300" />
                  <span className="font-semibold text-amber-800">Scheduled Events (Highlighted)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Calendar 7-Day Grid with Smooth Month Transition Animation */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 bg-slate-100/80 border-b border-slate-200 text-center py-2 text-[11px] font-black text-slate-600 uppercase tracking-wider">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Animated Day Cells Container */}
            <div className="overflow-hidden relative min-h-[380px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${currentYear}-${currentMonth}`}
                  initial={{ opacity: 0, x: monthTransitionDirection > 0 ? 30 : -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: monthTransitionDirection > 0 ? -30 : 30 }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                  className="grid grid-cols-7 divide-x divide-y divide-slate-100"
                >
                  {calendarDays.map((dayItem, idx) => {
                    const isSelected = selectedDate === dayItem.dateStr;
                    const isToday = dayItem.dateStr === todayStr;
                    const hasMatches = !!dayItem.summary && dayItem.summary.total > 0;
                    const hasCompleted = dayItem.summary && dayItem.summary.completed > 0;
                    const hasScheduled = dayItem.summary && dayItem.summary.scheduled > 0;

                    return (
                      <button
                        key={`${dayItem.dateStr}-${idx}`}
                        type="button"
                        onClick={() => onSelectDate(dayItem.dateStr)}
                        className={`min-h-[78px] sm:min-h-[92px] p-2 text-left transition-all flex flex-col justify-between relative group cursor-pointer ${
                          !dayItem.isCurrentMonth
                            ? 'bg-slate-50/40 text-slate-400 hover:bg-slate-100/60'
                            : hasScheduled
                            ? 'bg-amber-50/40 hover:bg-amber-100/60 ring-1 ring-amber-300/80 shadow-xs'
                            : 'bg-white hover:bg-emerald-50/30'
                        } ${
                          isSelected
                            ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-50/90 z-10 shadow-md'
                            : ''
                        }`}
                      >
                        {/* Scheduled Event Beacon Glow Effect */}
                        {hasScheduled && (
                          <div className="absolute top-1 right-1 flex items-center justify-center">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                          </div>
                        )}

                        {/* Top Row: Day Number & Today indicator */}
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-bold rounded-md px-1.5 py-0.5 transition-colors ${
                              isSelected
                                ? 'bg-emerald-700 text-white font-black shadow-2xs'
                                : isToday
                                ? 'bg-slate-900 text-white font-bold'
                                : hasScheduled
                                ? 'bg-amber-200/80 text-amber-950 font-black border border-amber-300'
                                : hasMatches
                                ? 'text-slate-900 font-extrabold'
                                : 'text-slate-600'
                            }`}
                          >
                            {dayItem.dayNumber}
                          </span>

                          {hasMatches && (
                            <span className="text-[10px] font-mono font-black text-slate-600 mr-2">
                              {dayItem.summary?.total} {dayItem.summary?.total === 1 ? 'game' : 'games'}
                            </span>
                          )}
                        </div>

                        {/* Middle: Game status badges & Highlight Badges */}
                        <div className="mt-1 space-y-1 w-full">
                          {hasMatches && dayItem.summary && (
                            <div className="flex flex-col gap-0.5">
                              {hasCompleted && (
                                <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-100/90 rounded px-1 py-0.5 truncate">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
                                  <span className="truncate">{dayItem.summary.completed} Results</span>
                                </div>
                              )}

                              {hasScheduled && (
                                <div className="flex items-center gap-1 text-[10px] text-amber-900 font-extrabold bg-gradient-to-r from-amber-100 to-amber-200/90 border border-amber-300 rounded px-1 py-0.5 truncate shadow-2xs animate-in fade-in">
                                  <Clock className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                                  <span className="truncate">{dayItem.summary.scheduled} Scheduled</span>
                                </div>
                              )}
                            </div>
                          )}

                          {!hasMatches && dayItem.isCurrentMonth && (
                            <div className="hidden group-hover:block text-[9px] text-slate-400 italic">
                              Click to check
                            </div>
                          )}
                        </div>

                        {/* Bottom Indicator Line */}
                        {hasMatches && (
                          <div className="mt-auto pt-1 flex items-center gap-1.5">
                            {hasCompleted && (
                              <span className="w-2 h-2 rounded-full bg-emerald-600" title="Completed Match Results" />
                            )}
                            {hasScheduled && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-300 animate-pulse" title="Scheduled Event Active" />
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Quick-Access Game Days Ribbon */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quick-Select Tournament Game Days ({allGameDates.length} Recorded Match Days):</span>
              </span>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => onSelectDate(null)}
                  className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                >
                  View All Dates
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectDate(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDate === null
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Dates ({fixtures.length} matches)
              </button>

              {allGameDates.map(dateStr => {
                const info = dateSummaries.get(dateStr);
                const isSel = selectedDate === dateStr;
                const hasFinished = info && info.completed > 0;
                const hasUpcoming = info && info.scheduled > 0;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => onSelectDate(dateStr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isSel
                        ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-400'
                        : hasUpcoming
                        ? 'bg-amber-50 text-amber-950 border border-amber-300 hover:bg-amber-100/80 shadow-2xs'
                        : 'bg-white text-slate-800 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50'
                    }`}
                  >
                    <span>{formatFriendlyDate(dateStr)}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                        isSel
                          ? 'bg-emerald-900 text-white'
                          : hasFinished
                          ? 'bg-emerald-100 text-emerald-800 font-bold'
                          : 'bg-amber-200 text-amber-900 font-bold'
                      }`}
                    >
                      {info?.total} {info?.total === 1 ? 'game' : 'games'}
                      {hasUpcoming ? ` • ${info?.scheduled} scheduled` : ''}
                      {hasFinished ? ` • ${info?.completed} done` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE DATE FILTER HIGHLIGHT & RESULTS STATUS BANNER */}
      {selectedDate && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white border-t border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                Filtered Game Day
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white">
              {formatFriendlyDate(selectedDate)}
            </h4>

            {selectedDateSummary && selectedDateSummary.total > 0 ? (
              <p className="text-xs text-slate-300">
                <strong>{selectedDateSummary.total}</strong> tournament {selectedDateSummary.total === 1 ? 'game' : 'games'} on this date •{' '}
                <span className="text-emerald-300 font-bold">{selectedDateSummary.completed} completed with certified results</span> •{' '}
                <span className="text-amber-300 font-bold">{selectedDateSummary.scheduled} pending/scheduled</span>
              </p>
            ) : (
              <p className="text-xs text-amber-200">
                No official games were played or scheduled on this specific date.
              </p>
            )}
          </div>

          {/* Sub-Filters for Games on this Selected Date */}
          {selectedDateSummary && selectedDateSummary.total > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold mr-1">Display:</span>
              <button
                type="button"
                onClick={() => onChangeGameStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  gameStatusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                All on Date ({selectedDateSummary.total})
              </button>

              <button
                type="button"
                onClick={() => onChangeGameStatusFilter('completed_only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  gameStatusFilter === 'completed_only'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Results Only ({selectedDateSummary.completed})</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeGameStatusFilter('scheduled_only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  gameStatusFilter === 'scheduled_only'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Scheduled ({selectedDateSummary.scheduled})</span>
              </button>

              {/* Prev / Next Date Steppers */}
              <div className="flex items-center gap-1 pl-2 border-l border-slate-700">
                <button
                  type="button"
                  onClick={() => handleStepGameDate('prev')}
                  disabled={currentSelectedDateIndex <= 0}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition-colors"
                  title="Previous Game Day"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStepGameDate('next')}
                  disabled={currentSelectedDateIndex === -1 || currentSelectedDateIndex >= allGameDates.length - 1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition-colors"
                  title="Next Game Day"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => onSelectDate(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Clear date filter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectDate(null)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to All Dates</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
