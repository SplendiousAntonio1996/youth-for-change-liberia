import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Trophy,
  Sparkles,
  BookOpen,
  Download,
  Copy,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Users,
  Info,
  X,
  ExternalLink,
  Flame,
  Award,
  Swords,
  Check,
  ArrowRight,
  Radio,
  Layers,
  Sparkle
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  CHAMPIONSHIP_CALENDAR_2024_25, 
  SEASON_MONTHS, 
  CALENDAR_CATEGORY_CONFIG 
} from '../data/debateCalendarData';
import { DebateCalendarEvent, DebateCalendarCategory } from '../types';
import { TournamentFixture } from '../types/tournament';
import { INITIAL_SEASON_FIXTURES } from '../data/tournamentZoningData';
import { useToast } from '../context/ToastContext';

interface DebateSeasonCalendarProps {
  onRegisterInterest?: () => void;
}

export const DebateSeasonCalendar: React.FC<DebateSeasonCalendarProps> = ({
  onRegisterInterest
}) => {
  const toast = useToast();

  // State: Live Tournament Fixtures (synced with Firestore)
  const [fixtures, setFixtures] = useState<TournamentFixture[]>(INITIAL_SEASON_FIXTURES);
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(false);

  // State: View Mode ('grid' | 'timeline')
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  // State: Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // State: Search Query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State: Current Month in Grid View
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(7); // Default to May 2025

  // State: Selected Date for Day Inspection
  const [selectedDate, setSelectedDate] = useState<string>('2025-05-24');

  // State: Day Inspector sub-filter ('all' | 'pending' | 'completed' | 'milestones')
  const [dayViewFilter, setDayViewFilter] = useState<'all' | 'pending' | 'completed' | 'milestones'>('all');

  // State: Active inspected event for detail modal
  const [inspectedEvent, setInspectedEvent] = useState<DebateCalendarEvent | null>(null);

  // State: Active inspected game fixture for detail modal
  const [inspectedFixture, setInspectedFixture] = useState<TournamentFixture | null>(null);

  // 1. Subscribe to real-time tournamentFixtures in Firestore
  useEffect(() => {
    try {
      if (!db) {
        setFixtures(INITIAL_SEASON_FIXTURES);
        setIsLiveSynced(true);
        return;
      }
      const fixturesRef = collection(db, 'tournamentFixtures');
      const unsubscribe = onSnapshot(fixturesRef, (snapshot) => {
        if (!snapshot.empty) {
          const loaded: TournamentFixture[] = [];
          snapshot.forEach((docSnap) => {
            loaded.push({ id: docSnap.id, ...docSnap.data() } as TournamentFixture);
          });
          // Sort by match date and time
          loaded.sort((a, b) => {
            if (a.matchDate !== b.matchDate) return (a.matchDate || '').localeCompare(b.matchDate || '');
            return (a.matchTime || '').localeCompare(b.matchTime || '');
          });
          setFixtures(loaded);
          setIsLiveSynced(true);
        } else {
          setFixtures(INITIAL_SEASON_FIXTURES);
          setIsLiveSynced(true);
        }
      }, (err) => {
        console.warn('Firestore calendar fixture sync note:', err);
        setFixtures(INITIAL_SEASON_FIXTURES);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore calendar fixtures subscription not available:', e);
      setFixtures(INITIAL_SEASON_FIXTURES);
    }
  }, []);

  // 2. Dynamic Months List: merge default season months with any months present in live fixtures
  const availableMonths = useMemo(() => {
    const map = new Map<string, { year: number; month: number; label: string; short: string; note: string }>();

    SEASON_MONTHS.forEach(m => {
      const key = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
      map.set(key, m);
    });

    fixtures.forEach(f => {
      if (!f.matchDate) return;
      const [yStr, mStr] = f.matchDate.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10) - 1;
      if (isNaN(y) || isNaN(m)) return;
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      if (!map.has(key)) {
        const d = new Date(y, m, 1);
        const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const short = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        map.set(key, {
          year: y,
          month: m,
          label,
          short,
          note: 'Scheduled Games'
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [fixtures]);

  // Current month config (safe against bounds)
  const currentMonth = useMemo(() => {
    if (currentMonthIndex >= 0 && currentMonthIndex < availableMonths.length) {
      return availableMonths[currentMonthIndex];
    }
    return availableMonths[0] || SEASON_MONTHS[0];
  }, [availableMonths, currentMonthIndex]);

  // 3. Computed: All pending vs completed fixtures
  const allPendingFixtures = useMemo(() => {
    return fixtures.filter(f => f.status !== 'completed' && !!f.matchDate);
  }, [fixtures]);

  const allCompletedFixtures = useMemo(() => {
    return fixtures.filter(f => f.status === 'completed' && !!f.matchDate);
  }, [fixtures]);

  // 4. NEXT SCHEDULED TOURNAMENT CLASH (Earliest pending fixture by matchDate)
  // When this game finishes and we feed the system, it automatically updates and is removed,
  // and the next date's fixture appears in this spotlight!
  const nextPendingFixture = useMemo(() => {
    if (allPendingFixtures.length === 0) return null;
    const sorted = [...allPendingFixtures].sort((a, b) => {
      if (a.matchDate !== b.matchDate) return a.matchDate.localeCompare(b.matchDate);
      return (a.matchTime || '').localeCompare(b.matchTime || '');
    });
    return sorted[0];
  }, [allPendingFixtures]);

  // All pending matches on that exact next date
  const nextDateFixtures = useMemo(() => {
    if (!nextPendingFixture) return [];
    return allPendingFixtures.filter(f => f.matchDate === nextPendingFixture.matchDate);
  }, [allPendingFixtures, nextPendingFixture]);

  // 4b. Active Auto-Synchronization Engine:
  // Automatically tracks the next upcoming tournament game day.
  // Whenever games finish and results are fed into the system, or when the admin pushes new dates,
  // this automatically focuses the active calendar on the next upcoming fixture date!
  const hasUserSelectedDateManually = useRef<boolean>(false);

  useEffect(() => {
    if (!nextPendingFixture?.matchDate) return;

    // Check if the currently inspected date still has pending games to play
    const currentSelectedHasPending = fixtures.some(
      f => f.matchDate === selectedDate && f.status !== 'completed'
    );

    // If user hasn't manually clicked another date, or if all games on the previously selected date are now completed:
    if (!hasUserSelectedDateManually.current || !currentSelectedHasPending) {
      setSelectedDate(nextPendingFixture.matchDate);
      const [yStr, mStr] = nextPendingFixture.matchDate.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10) - 1;
      const idx = availableMonths.findIndex(mo => mo.year === y && mo.month === m);
      if (idx !== -1) {
        setCurrentMonthIndex(idx);
      }
    }
  }, [nextPendingFixture?.matchDate, fixtures, availableMonths]);

  // 5. Jump to a specific date anywhere on the calendar
  const handleJumpToDate = (dateStr: string) => {
    if (!dateStr) return;
    hasUserSelectedDateManually.current = false;
    const [yStr, mStr] = dateStr.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10) - 1;
    const idx = availableMonths.findIndex(mo => mo.year === y && mo.month === m);
    if (idx !== -1) {
      setCurrentMonthIndex(idx);
    }
    setSelectedDate(dateStr);
    setViewMode('grid');
    setDayViewFilter('all');
    setTimeout(() => {
      const el = document.getElementById('debate-season-calendar-grid');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 80);
  };

  // Helper to jump to a specific month
  const handleJumpToMonth = (index: number) => {
    setCurrentMonthIndex(index);
    const targetMonth = availableMonths[index];
    if (!targetMonth) return;

    // Find first fixture or event in this month to select date
    const firstFixture = fixtures.find(f => {
      if (!f.matchDate) return false;
      const [y, mo] = f.matchDate.split('-').map(Number);
      return y === targetMonth.year && mo === targetMonth.month + 1;
    });

    if (firstFixture && firstFixture.matchDate) {
      setSelectedDate(firstFixture.matchDate);
      return;
    }

    const firstEvent = CHAMPIONSHIP_CALENDAR_2024_25.find(ev => {
      const [y, mo] = ev.date.split('-').map(Number);
      return y === targetMonth.year && mo === targetMonth.month + 1;
    });
    if (firstEvent) {
      setSelectedDate(firstEvent.date);
    }
  };

  // Filtered milestone events based on category and search
  const filteredEvents = useMemo(() => {
    return CHAMPIONSHIP_CALENDAR_2024_25.filter(ev => {
      const matchesCategory = selectedCategory === 'all' || ev.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        ev.title.toLowerCase().includes(q) ||
        ev.venue.toLowerCase().includes(q) ||
        ev.county.toLowerCase().includes(q) ||
        ev.phase.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Filtered fixtures based on category & search
  const filteredFixtures = useMemo(() => {
    return fixtures.filter(f => {
      if (selectedCategory === 'games') return true;
      if (selectedCategory === 'games_pending') return f.status !== 'completed';
      if (selectedCategory === 'games_completed') return f.status === 'completed';
      if (selectedCategory !== 'all') return false; // Other categories belong to milestones

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        f.teamA.schoolName.toLowerCase().includes(q) ||
        f.teamB.schoolName.toLowerCase().includes(q) ||
        f.county.toLowerCase().includes(q) ||
        f.venue.toLowerCase().includes(q) ||
        f.roundName.toLowerCase().includes(q) ||
        f.motion.toLowerCase().includes(q)
      );
    });
  }, [fixtures, selectedCategory, searchQuery]);

  // Calendar Grid Builder for the current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.year;
    const month = currentMonth.month;
    
    // First day of month (0 = Sunday, 1 = Monday, ...)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Total days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Previous month total days
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      events: DebateCalendarEvent[];
      dayFixtures: TournamentFixture[];
      pendingFixturesCount: number;
      completedFixturesCount: number;
      isGrandFinal: boolean;
    }> = [];

    // Preceding padding days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        events: [],
        dayFixtures: [],
        pendingFixturesCount: 0,
        completedFixturesCount: 0,
        isGrandFinal: false
      });
    }

    // Days of the current month
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = CHAMPIONSHIP_CALENDAR_2024_25.filter(ev => {
        if (ev.date === dateStr) return true;
        if (ev.endDate && dateStr >= ev.date && dateStr <= ev.endDate) return true;
        return false;
      });

      const dayFixtures = fixtures.filter(f => f.matchDate === dateStr);
      const pendingCount = dayFixtures.filter(f => f.status !== 'completed').length;
      const completedCount = dayFixtures.filter(f => f.status === 'completed').length;

      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        events: dayEvents,
        dayFixtures,
        pendingFixturesCount: pendingCount,
        completedFixturesCount: completedCount,
        isGrandFinal: dayEvents.some(e => e.isGrandFinal) || dayFixtures.some(f => f.stage === 'national_championship' && f.roundName.toLowerCase().includes('grand final'))
      });
    }

    // Trailing padding days to fill 35 or 42 grid cells
    const remainingCells = 42 - days.length;
    if (remainingCells > 0 && remainingCells < 7) {
      for (let d = 1; d <= remainingCells; d++) {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({
          dateStr,
          dayNumber: d,
          isCurrentMonth: false,
          events: [],
          dayFixtures: [],
          pendingFixturesCount: 0,
          completedFixturesCount: 0,
          isGrandFinal: false
        });
      }
    }

    return days;
  }, [currentMonth, fixtures]);

  // Selected date items
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return CHAMPIONSHIP_CALENDAR_2024_25.filter(ev => {
      if (ev.date === selectedDate) return true;
      if (ev.endDate && selectedDate >= ev.date && selectedDate <= ev.endDate) return true;
      return false;
    });
  }, [selectedDate]);

  const selectedDateFixtures = useMemo(() => {
    if (!selectedDate) return [];
    return fixtures.filter(f => f.matchDate === selectedDate);
  }, [selectedDate, fixtures]);

  const selectedDatePending = useMemo(() => {
    return selectedDateFixtures.filter(f => f.status !== 'completed');
  }, [selectedDateFixtures]);

  const selectedDateCompleted = useMemo(() => {
    return selectedDateFixtures.filter(f => f.status === 'completed');
  }, [selectedDateFixtures]);

  // Format friendly date
  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Generate and download .ics iCalendar file for milestones
  const handleDownloadIcs = (event: DebateCalendarEvent) => {
    try {
      const startDateFormatted = event.date.replace(/-/g, '');
      let endDateFormatted = startDateFormatted;
      if (event.endDate) {
        const [y, m, d] = event.endDate.split('-').map(Number);
        const nextDay = new Date(y, m - 1, d + 1);
        endDateFormatted = `${nextDay.getFullYear()}${String(nextDay.getMonth() + 1).padStart(2, '0')}${String(nextDay.getDate()).padStart(2, '0')}`;
      }

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Youth For Change Liberia//National Debate Championship//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:yfc-debate-${event.id}@youthforchange.org.lr`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${startDateFormatted}`,
        `DTEND;VALUE=DATE:${endDateFormatted}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description.replace(/\n/g, '\\n')} (Phase: ${event.phase})`,
        `LOCATION:${event.venue}, ${event.county} County, Liberia`,
        'STATUS:CONFIRMED',
        'ORGANIZER;CN="Youth For Change Liberia Forensics Secretariat":mailto:info@youthforchange.org.lr',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `YFC-Championship-${event.id}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded calendar file (.ics) for "${event.title}".`, 'Added to Calendar');
    } catch (err) {
      console.error('Failed to generate ICS:', err);
      toast.error('Unable to generate calendar invite file.', 'Calendar Error');
    }
  };

  // Generate and download .ics iCalendar file for game fixtures
  const handleDownloadFixtureIcs = (fixture: TournamentFixture) => {
    try {
      const dateFormatted = (fixture.matchDate || '').replace(/-/g, '');
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Youth For Change Liberia//National Debate Championship Fixture//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:yfc-match-${fixture.id}@youthforchange.org.lr`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${dateFormatted}`,
        `DTEND;VALUE=DATE:${dateFormatted}`,
        `SUMMARY:Debate Match: ${fixture.teamA.schoolName} vs ${fixture.teamB.schoolName}`,
        `DESCRIPTION:Official Tournament Match (${fixture.roundName})\\nProposition: ${fixture.teamA.schoolName}\\nOpposition: ${fixture.teamB.schoolName}\\nMotion: "${fixture.motion.replace(/\n/g, ' ')}"\\nTime: ${fixture.matchTime}`,
        `LOCATION:${fixture.venue}, ${fixture.county} County, Liberia`,
        'STATUS:CONFIRMED',
        'ORGANIZER;CN="Youth For Change Liberia Tournament Secretariat":mailto:info@youthforchange.org.lr',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Match-${fixture.id}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded calendar invite for ${fixture.teamA.schoolName} vs ${fixture.teamB.schoolName}!`, 'Calendar Invite');
    } catch (err) {
      console.error('Failed to generate fixture ICS:', err);
      toast.error('Unable to generate calendar file.', 'Calendar Error');
    }
  };

  // Copy fixture details to clipboard
  const handleCopyFixtureDetails = (fixture: TournamentFixture) => {
    const text = [
      `⚔️ YFC National Debate Championship Match`,
      `Round: ${fixture.roundName} (${fixture.county} County)`,
      `Matchup: ${fixture.teamA.schoolName} [${fixture.teamA.role}] vs ${fixture.teamB.schoolName} [${fixture.teamB.role}]`,
      `Date & Time: ${formatFriendlyDate(fixture.matchDate)} at ${fixture.matchTime}`,
      `Venue: ${fixture.venue}`,
      `Motion: "${fixture.motion}"`,
      fixture.status === 'completed' 
        ? `Status: Concluded | Winner: ${fixture.winnerName || 'Decided'} (${fixture.scoreDifferential || 'Official Score'})`
        : `Status: Scheduled Face-Off`,
      `Draw Verification: ${fixture.antiBiasHash}`
    ].join('\n');

    navigator.clipboard.writeText(text);
    toast.success('Match fixture details copied to clipboard!', 'Copied');
  };

  // Copy event details to clipboard
  const handleCopyEventDetails = (event: DebateCalendarEvent) => {
    const text = [
      `🏆 YFC National Debate Championship 2024-25`,
      `Event: ${event.title}`,
      `Date: ${formatFriendlyDate(event.date)}${event.endDate ? ` to ${formatFriendlyDate(event.endDate)}` : ''}`,
      `Time: ${event.time}`,
      `Venue: ${event.venue} (${event.county} County)`,
      `Phase: ${event.phase}`,
      `Details: ${event.description}`,
      `Secretariat: info@youthforchange.org.lr`
    ].join('\n');

    navigator.clipboard.writeText(text);
    toast.success('Event details copied to clipboard!', 'Copied');
  };

  return (
    <div id="debate-season-calendar" className="space-y-8">
      {/* SECTION HEADER CARD */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-emerald-800 shadow-xl relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-bold uppercase tracking-wider border border-yellow-400/30">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>2024-25 Official Championship Schedule</span>
                {isLiveSynced && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 ml-1">
                    • <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" /> Live Admin Synchronized
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Championship Calendar & Key Milestones
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                Track tournament phases, game days, county qualifiers, super-knockouts, and live synchronized fixtures across Liberia’s 15 counties.
              </p>
            </div>

            {/* View Switcher Pill */}
            <div className="flex items-center bg-emerald-950/80 p-1.5 rounded-2xl border border-emerald-700/60 shrink-0">
              <button
                id="cal-view-grid-btn"
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-yellow-400 text-emerald-950 shadow-md'
                    : 'text-emerald-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Monthly Grid View</span>
              </button>
              <button
                id="cal-view-timeline-btn"
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-yellow-400 text-emerald-950 shadow-md'
                    : 'text-emerald-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Season Roadmap ({CHAMPIONSHIP_CALENDAR_2024_25.length})</span>
              </button>
            </div>
          </div>

          {/* Quick Season Metric Stat Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-emerald-800/80">
            <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block tracking-wider">Scheduled Milestones</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{CHAMPIONSHIP_CALENDAR_2024_25.length} Events</div>
              <span className="text-[10px] text-emerald-200/80 block mt-0.5">Oct 2024 – Jun 2025</span>
            </div>

            <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block tracking-wider">Tournament Matches</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{fixtures.length} Fixtures</div>
              <span className="text-[10px] text-emerald-200/80 block mt-0.5">
                {allPendingFixtures.length} Upcoming • {allCompletedFixtures.length} Decided
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-yellow-300 block tracking-wider">Next Game Face-Off</span>
              <div className="text-base sm:text-lg font-black text-yellow-400 mt-1 truncate">
                {nextPendingFixture ? formatFriendlyDate(nextPendingFixture.matchDate) : 'All Games Finished'}
              </div>
              <span className="text-[10px] text-yellow-200/90 block mt-0.5 truncate">
                {nextPendingFixture ? `${nextPendingFixture.teamA.schoolName} vs ${nextPendingFixture.teamB.schoolName}` : 'Season Record Sealed'}
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block tracking-wider">National Grand Final</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-0.5">May 24, 2025</div>
              <span className="text-[10px] text-emerald-200/90 block mt-0.5">SKD Sports Complex Gym</span>
            </div>
          </div>
        </div>
      </div>

      {/* NEXT SCHEDULED TOURNAMENT FACE-OFF SPOTLIGHT BANNER */}
      {nextPendingFixture ? (
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 border-2 border-yellow-500/50 rounded-3xl p-5 sm:p-7 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400 text-emerald-950 text-xs font-black uppercase tracking-wider shadow-sm animate-pulse">
                  <Swords className="w-3.5 h-3.5" />
                  <span>Next Scheduled Tournament Face-Off</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                  <CalendarIcon className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{formatFriendlyDate(nextPendingFixture.matchDate)}</span>
                </span>
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{nextPendingFixture.matchTime} GMT</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-slate-300 uppercase font-extrabold tracking-wider">
                  {nextPendingFixture.roundName} • {nextPendingFixture.county} County
                </span>
              </div>

              {/* Clash Teams Header */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-2xl border border-white/15">
                  <span className="text-[10px] font-black uppercase text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded">Proposition</span>
                  <span className="text-base sm:text-xl font-black text-white">{nextPendingFixture.teamA.schoolName}</span>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-yellow-400 px-2">VS</span>
                <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-2xl border border-white/15">
                  <span className="text-[10px] font-black uppercase text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded">Opposition</span>
                  <span className="text-base sm:text-xl font-black text-white">{nextPendingFixture.teamB.schoolName}</span>
                </div>
              </div>

              {/* Match Venue and Motion */}
              <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-white">{nextPendingFixture.venue}</span>
                  <span className="text-slate-400">({nextPendingFixture.county} County Venue)</span>
                  {nextDateFixtures.length > 1 && (
                    <span className="ml-2 text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded-md border border-yellow-400/30 text-[11px]">
                      +{nextDateFixtures.length - 1} more scheduled game on this date
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-2 text-slate-200">
                  <BookOpen className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="line-clamp-2 italic">
                    <strong>Assigned Motion:</strong> "{nextPendingFixture.motion}"
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 w-full lg:w-auto">
              <button
                id="jump-to-next-game-btn"
                onClick={() => handleJumpToDate(nextPendingFixture.matchDate)}
                className="w-full px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Focus This Date ({formatFriendlyDate(nextPendingFixture.matchDate)})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={() => handleDownloadFixtureIcs(nextPendingFixture)}
                  className="flex-1 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/10"
                >
                  <Download className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Calendar Invite</span>
                </button>
                <button
                  onClick={() => setInspectedFixture(nextPendingFixture)}
                  className="flex-1 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-yellow-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/10"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Match Dossier</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : allCompletedFixtures.length > 0 ? (
        <div className="bg-emerald-950 border border-emerald-800 rounded-3xl p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400 text-emerald-950 flex items-center justify-center shrink-0 shadow-md">
              <Trophy className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h4 className="text-base font-black text-white">All Scheduled Games Concluded & System Updated</h4>
              <p className="text-xs text-emerald-200">
                All {allCompletedFixtures.length} matches have finished. Official results, scores, and ballot decisions are recorded on the calendar dates below.
              </p>
            </div>
          </div>
          <span className="text-xs px-3.5 py-1.5 rounded-full bg-yellow-400/20 text-yellow-300 font-bold border border-yellow-400/30">
            Official Results Sealed
          </span>
        </div>
      ) : null}

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>

            {/* All Filter */}
            <button
              id="cal-filter-all"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedCategory === 'all' ? 'bg-yellow-400' : 'bg-emerald-600'}`} />
              <span>All Activities</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                selectedCategory === 'all' ? 'bg-emerald-950/60 text-yellow-300' : 'bg-slate-200 text-slate-700'
              }`}>
                {CHAMPIONSHIP_CALENDAR_2024_25.length + fixtures.length}
              </span>
            </button>

            {/* Games to Play Filter */}
            <button
              id="cal-filter-games-pending"
              onClick={() => setSelectedCategory('games_pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'games_pending'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Swords className="w-3 h-3 text-amber-600" />
              <span>Games to Play</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                selectedCategory === 'games_pending' ? 'bg-emerald-950/60 text-yellow-300' : 'bg-amber-200 text-amber-900'
              }`}>
                {allPendingFixtures.length}
              </span>
            </button>

            {/* Concluded Games Filter */}
            <button
              id="cal-filter-games-completed"
              onClick={() => setSelectedCategory('games_completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'games_completed'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Concluded Results</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                selectedCategory === 'games_completed' ? 'bg-emerald-950/60 text-yellow-300' : 'bg-emerald-200 text-emerald-900'
              }`}>
                {allCompletedFixtures.length}
              </span>
            </button>

            {/* Milestones Filters */}
            {Object.entries(CALENDAR_CATEGORY_CONFIG).filter(([k]) => k !== 'all').map(([key, config]) => {
              const active = selectedCategory === key;
              const count = CHAMPIONSHIP_CALENDAR_2024_25.filter(e => e.category === key).length;

              return (
                <button
                  key={key}
                  id={`cal-filter-${key}`}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${active ? 'bg-yellow-400' : config.dot}`} />
                  <span>{config.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    active ? 'bg-emerald-950/60 text-yellow-300' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search school, venue, county, motion..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Season Month Navigation Pills (Available in Grid View) */}
        {viewMode === 'grid' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-2">
              Month Jump:
            </span>
            {availableMonths.map((m, idx) => {
              const active = currentMonthIndex === idx;
              const hasEvents = CHAMPIONSHIP_CALENDAR_2024_25.some(e => {
                const [y, mo] = e.date.split('-').map(Number);
                return y === m.year && mo === m.month + 1;
              });
              const hasFixtures = fixtures.some(f => {
                if (!f.matchDate) return false;
                const [y, mo] = f.matchDate.split('-').map(Number);
                return y === m.year && mo === m.month + 1;
              });

              return (
                <button
                  key={idx}
                  id={`jump-month-${idx}`}
                  onClick={() => handleJumpToMonth(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-emerald-700 text-white font-bold shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  <span>{m.short}</span>
                  {(hasEvents || hasFixtures) && (
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-yellow-300' : hasFixtures ? 'bg-amber-500' : 'bg-emerald-600'}`} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* VIEW 1: MONTHLY CALENDAR GRID */}
      {viewMode === 'grid' && (
        <div id="debate-season-calendar-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Calendar Grid Left Column */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            {/* Month Header Controller */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-800">
                  {currentMonth.note}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {currentMonth.label}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="cal-prev-month"
                  onClick={() => setCurrentMonthIndex(i => Math.max(0, i - 1))}
                  disabled={currentMonthIndex === 0}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-all"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  id="cal-next-month"
                  onClick={() => setCurrentMonthIndex(i => Math.min(availableMonths.length - 1, i + 1))}
                  disabled={currentMonthIndex === availableMonths.length - 1}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-all"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Cells Matrix */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((cell, idx) => {
                const isSelected = selectedDate === cell.dateStr;
                const hasEvents = cell.events.length > 0;
                const hasPendingFixtures = cell.pendingFixturesCount > 0;
                const hasCompletedFixtures = cell.completedFixturesCount > 0;
                const isNextDate = nextPendingFixture?.matchDate === cell.dateStr;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (cell.isCurrentMonth) {
                        hasUserSelectedDateManually.current = true;
                        setSelectedDate(cell.dateStr);
                        if (cell.events.length > 0) {
                          setInspectedEvent(cell.events[0]);
                        } else if (cell.dayFixtures.length > 0) {
                          setInspectedFixture(cell.dayFixtures[0]);
                        }
                      }
                    }}
                    disabled={!cell.isCurrentMonth}
                    className={`min-h-[70px] sm:min-h-[82px] p-1.5 sm:p-2 rounded-2xl flex flex-col justify-between transition-all text-left relative ${
                      !cell.isCurrentMonth
                        ? 'opacity-25 bg-slate-50 cursor-default'
                        : isSelected
                        ? 'bg-emerald-50 border-2 border-emerald-700 shadow-md ring-2 ring-emerald-700/20'
                        : isNextDate
                        ? 'bg-amber-50/90 border-2 border-yellow-500 shadow-md ring-2 ring-yellow-400/40'
                        : cell.isGrandFinal
                        ? 'bg-amber-50/80 border border-yellow-300 hover:border-yellow-400 hover:bg-amber-100/50'
                        : hasPendingFixtures
                        ? 'bg-amber-50/40 border border-amber-300/80 hover:border-amber-400 hover:bg-amber-50'
                        : hasCompletedFixtures
                        ? 'bg-emerald-50/40 border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50'
                        : hasEvents
                        ? 'bg-blue-50/40 border border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                        : 'bg-white border border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-bold ${
                        isSelected 
                          ? 'text-emerald-900 font-black' 
                          : isNextDate
                          ? 'text-amber-950 font-black'
                          : cell.isGrandFinal 
                          ? 'text-amber-900 font-black' 
                          : 'text-slate-700'
                      }`}>
                        {cell.dayNumber}
                      </span>

                      <div className="flex items-center gap-1">
                        {isNextDate && (
                          <span className="text-[9px] px-1 py-0.2 bg-yellow-400 text-emerald-950 font-black rounded uppercase">
                            Next
                          </span>
                        )}
                        {cell.isGrandFinal && (
                          <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                        )}
                      </div>
                    </div>

                    {/* Event & Game Fixture indicators */}
                    <div className="space-y-1 w-full mt-1">
                      {/* Live Pending Game Badges */}
                      {hasPendingFixtures && (
                        <div
                          className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-black truncate leading-tight bg-amber-500 text-slate-950 flex items-center gap-1 shadow-2xs"
                          title={`${cell.pendingFixturesCount} pending match${cell.pendingFixturesCount > 1 ? 'es' : ''} to be played on this date`}
                        >
                          <Swords className="w-2.5 h-2.5 shrink-0 text-slate-900" />
                          <span className="truncate">
                            {cell.pendingFixturesCount === 1 
                              ? `${cell.dayFixtures.find(f => f.status !== 'completed')?.teamA.schoolName.split(' ')[0]} vs ${cell.dayFixtures.find(f => f.status !== 'completed')?.teamB.schoolName.split(' ')[0]}`
                              : `${cell.pendingFixturesCount} Games`}
                          </span>
                        </div>
                      )}

                      {/* Concluded Decided Match Badges */}
                      {hasCompletedFixtures && (
                        <div
                          className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-bold truncate leading-tight bg-emerald-100 text-emerald-900 flex items-center gap-1 border border-emerald-300/50"
                          title={`${cell.completedFixturesCount} match result${cell.completedFixturesCount > 1 ? 's' : ''} recorded on this date`}
                        >
                          <Check className="w-2.5 h-2.5 shrink-0 text-emerald-700" />
                          <span className="truncate">
                            {cell.completedFixturesCount === 1 
                              ? `✓ ${cell.dayFixtures.find(f => f.status === 'completed')?.winnerName?.split(' ')[0] || 'Decided'}`
                              : `✓ ${cell.completedFixturesCount} Decided`}
                          </span>
                        </div>
                      )}

                      {/* Milestone Event Badges */}
                      {hasEvents && cell.events.slice(0, 1).map((ev, i) => (
                        <div
                          key={i}
                          className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-bold truncate leading-tight ${
                            ev.isGrandFinal
                              ? 'bg-yellow-400 text-emerald-950 shadow-xs'
                              : ev.category === 'deadline'
                              ? 'bg-rose-100 text-rose-900'
                              : ev.category === 'workshop'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                          title={ev.title}
                        >
                          {ev.tag || ev.title}
                        </div>
                      ))}

                      {cell.events.length + cell.dayFixtures.length > 2 && (
                        <span className="text-[8px] text-slate-500 font-bold block text-center">
                          +{cell.events.length + cell.dayFixtures.length - 2} more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-600" />
                  Games to Play
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  Concluded Results
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-500" />
                  Grand Final
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Milestone
                </span>
              </div>
              <span className="italic text-[10px] text-slate-400">
                Click any highlighted date for details
              </span>
            </div>
          </div>

          {/* Right Column: Day Inspection Card & Current Month Milestones */}
          <div className="lg:col-span-5 space-y-4">
            {/* Selected Day Inspection Card */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">
                    Inspection: {formatFriendlyDate(selectedDate)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedDatePending.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-yellow-300 font-black border border-yellow-400/30">
                      {selectedDatePending.length} Game{selectedDatePending.length > 1 ? 's' : ''} to Play
                    </span>
                  )}
                  {selectedDateCompleted.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                      {selectedDateCompleted.length} Concluded
                    </span>
                  )}
                  {selectedDateEvents.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30">
                      {selectedDateEvents.length} Event{selectedDateEvents.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Day View Sub-Filter Tabs */}
              {(selectedDateFixtures.length > 0 || selectedDateEvents.length > 0) && (
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                  <button
                    onClick={() => setDayViewFilter('all')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
                      dayViewFilter === 'all'
                        ? 'bg-yellow-400 text-emerald-950 font-black shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({selectedDateFixtures.length + selectedDateEvents.length})
                  </button>
                  {selectedDatePending.length > 0 && (
                    <button
                      onClick={() => setDayViewFilter('pending')}
                      className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
                        dayViewFilter === 'pending'
                          ? 'bg-yellow-400 text-emerald-950 font-black shadow-xs'
                          : 'text-amber-400 hover:text-white'
                      }`}
                    >
                      To Play ({selectedDatePending.length})
                    </button>
                  )}
                  {selectedDateCompleted.length > 0 && (
                    <button
                      onClick={() => setDayViewFilter('completed')}
                      className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
                        dayViewFilter === 'completed'
                          ? 'bg-yellow-400 text-emerald-950 font-black shadow-xs'
                          : 'text-emerald-400 hover:text-white'
                      }`}
                    >
                      Results ({selectedDateCompleted.length})
                    </button>
                  )}
                  {selectedDateEvents.length > 0 && (
                    <button
                      onClick={() => setDayViewFilter('milestones')}
                      className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
                        dayViewFilter === 'milestones'
                          ? 'bg-yellow-400 text-emerald-950 font-black shadow-xs'
                          : 'text-blue-400 hover:text-white'
                      }`}
                    >
                      Milestones ({selectedDateEvents.length})
                    </button>
                  )}
                </div>
              )}

              {/* Status Banner when all matches on this date have finished */}
              {selectedDateFixtures.length > 0 && selectedDatePending.length === 0 && selectedDateCompleted.length > 0 && (
                <div className="bg-emerald-950/90 border border-emerald-700/80 p-3.5 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>All {selectedDateCompleted.length} matches on this date have finished & were fed into the system!</span>
                  </div>
                  {nextPendingFixture && (
                    <button
                      onClick={() => handleJumpToDate(nextPendingFixture.matchDate)}
                      className="w-full py-2 px-3 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>👉 Jump to Next Scheduled Fixture ({formatFriendlyDate(nextPendingFixture.matchDate)})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Day Contents List */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {/* 1. MATCH FIXTURES (To Play) */}
                {(dayViewFilter === 'all' || dayViewFilter === 'pending') && selectedDatePending.map(fixture => (
                  <div key={fixture.id} className="space-y-3 bg-amber-950/30 p-4 rounded-2xl border border-amber-500/30">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-yellow-300 border border-amber-400/30">
                          ⚔️ {fixture.roundName} • To Be Played
                        </span>
                        <h4 className="text-base font-black text-white mt-1.5 flex items-center gap-2 flex-wrap">
                          <span className="text-yellow-300">{fixture.teamA.schoolName}</span>
                          <span className="text-[10px] text-slate-400">vs</span>
                          <span className="text-yellow-300">{fixture.teamB.schoolName}</span>
                        </h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-bold">
                        {fixture.county}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                        <span>{fixture.matchTime} GMT</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-medium text-white">{fixture.venue}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed italic bg-black/20 p-2 rounded-xl">
                      <strong>Motion:</strong> "{fixture.motion}"
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10">
                      <button
                        onClick={() => handleDownloadFixtureIcs(fixture)}
                        className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Calendar Invite</span>
                      </button>
                      <button
                        onClick={() => handleCopyFixtureDetails(fixture)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Match</span>
                      </button>
                      <button
                        onClick={() => setInspectedFixture(fixture)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-yellow-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Match Dossier</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* 2. MATCH FIXTURES (Concluded / Completed) */}
                {(dayViewFilter === 'all' || dayViewFilter === 'completed') && selectedDateCompleted.map(fixture => (
                  <div key={fixture.id} className="space-y-3 bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/40">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          ✓ {fixture.roundName} • Concluded & Recorded
                        </span>
                        <h4 className="text-base font-black text-white mt-1.5">
                          {fixture.teamA.schoolName} vs {fixture.teamB.schoolName}
                        </h4>
                      </div>
                      <div className="w-7 h-7 rounded-xl bg-yellow-400 text-emerald-950 flex items-center justify-center shrink-0 shadow-sm">
                        <Trophy className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </div>

                    {/* Certified Winner & Score Verdict */}
                    <div className="bg-emerald-900/50 p-2.5 rounded-xl border border-emerald-700/60 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-emerald-200">Winner:</span>
                        <span className="text-yellow-300 font-black">{fixture.winnerName || 'Winner Confirmed'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-emerald-100">
                        <span>Official Scores:</span>
                        <span>
                          {fixture.teamA.schoolName.split(' ')[0]}: {fixture.teamA.score} pts ({fixture.teamA.ballots} ballots) vs {fixture.teamB.schoolName.split(' ')[0]}: {fixture.teamB.score} pts ({fixture.teamB.ballots} ballots)
                        </span>
                      </div>
                      {fixture.scoreDifferential && (
                        <div className="text-[10px] text-emerald-300/80 italic text-right">
                          Margin: {fixture.scoreDifferential}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-medium text-white">{fixture.venue} ({fixture.county} County)</span>
                      </div>
                      <p className="text-[11px] text-slate-300 italic">
                        Motion: "{fixture.motion}"
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10">
                      <button
                        onClick={() => handleCopyFixtureDetails(fixture)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Verdict</span>
                      </button>
                      <button
                        onClick={() => setInspectedFixture(fixture)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-yellow-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Match Dossier</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* 3. MILESTONES ON THIS DATE */}
                {(dayViewFilter === 'all' || dayViewFilter === 'milestones') && selectedDateEvents.map(ev => (
                  <div key={ev.id} className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {ev.phase}
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-white mt-1.5 leading-snug">
                          {ev.title}
                        </h4>
                      </div>
                      {ev.isGrandFinal && (
                        <div className="w-8 h-8 rounded-xl bg-yellow-400 text-emerald-950 flex items-center justify-center shrink-0 shadow-md">
                          <Trophy className="w-4 h-4 fill-current" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                        <span>{ev.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-medium text-white">{ev.venue}</span>
                        <span className="text-slate-400">({ev.county} County)</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      {ev.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => handleDownloadIcs(ev)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Add to Calendar</span>
                      </button>
                      <button
                        onClick={() => handleCopyEventDetails(ev)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Info</span>
                      </button>
                      <button
                        onClick={() => setInspectedEvent(ev)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-yellow-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Full Dossier</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {selectedDateFixtures.length === 0 && selectedDateEvents.length === 0 && (
                  <div className="text-center py-8 space-y-2 text-slate-400">
                    <CalendarIcon className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                    <p className="text-xs font-semibold text-slate-300">No scheduled tournament matches or milestones on this date.</p>
                    <p className="text-[11px] text-slate-400">Select any highlighted date or click "Next Scheduled Tournament Face-Off" to inspect upcoming rounds.</p>
                    {nextPendingFixture && (
                      <button
                        onClick={() => handleJumpToDate(nextPendingFixture.matchDate)}
                        className="mt-3 px-4 py-2 bg-yellow-400 text-emerald-950 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <span>Jump to Next Scheduled Clash ({formatFriendlyDate(nextPendingFixture.matchDate)})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* All Milestones & Games in the current month overview */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  All Scheduled in {currentMonth.short}
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {CHAMPIONSHIP_CALENDAR_2024_25.filter(ev => {
                    const [y, m] = ev.date.split('-').map(Number);
                    return y === currentMonth.year && m === currentMonth.month + 1;
                  }).length + fixtures.filter(f => {
                    if (!f.matchDate) return false;
                    const [y, m] = f.matchDate.split('-').map(Number);
                    return y === currentMonth.year && m === currentMonth.month + 1;
                  }).length} Scheduled
                </span>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {/* Games in month */}
                {fixtures.filter(f => {
                  if (!f.matchDate) return false;
                  const [y, m] = f.matchDate.split('-').map(Number);
                  return y === currentMonth.year && m === currentMonth.month + 1;
                }).map(fixture => (
                  <div
                    key={fixture.id}
                    onClick={() => {
                      setSelectedDate(fixture.matchDate);
                      setInspectedFixture(fixture);
                    }}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 transition-all cursor-pointer flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {formatFriendlyDate(fixture.matchDate)}
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase ${
                          fixture.status === 'completed' ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {fixture.status === 'completed' ? '✓ Decided' : '⚔️ Scheduled'}
                        </span>
                      </div>
                      <h5 className="text-xs font-black text-slate-900 group-hover:text-emerald-950 transition-colors">
                        {fixture.teamA.schoolName} vs {fixture.teamB.schoolName}
                      </h5>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        📍 {fixture.venue} • {fixture.county} ({fixture.matchTime})
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFixtureIcs(fixture);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/60 transition-all cursor-pointer"
                      title="Add to Calendar"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Milestones in month */}
                {CHAMPIONSHIP_CALENDAR_2024_25.filter(ev => {
                  const [y, m] = ev.date.split('-').map(Number);
                  return y === currentMonth.year && m === currentMonth.month + 1;
                }).map(ev => (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setSelectedDate(ev.date);
                      setInspectedEvent(ev);
                    }}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/30 transition-all cursor-pointer flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {formatFriendlyDate(ev.date)}
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-800 uppercase">
                          {ev.tag}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 group-hover:text-emerald-950 transition-colors">
                        {ev.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        📍 {ev.venue} • {ev.county}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadIcs(ev);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/60 transition-all cursor-pointer"
                      title="Add to Calendar"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SEASON ROADMAP / TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="max-w-2xl mb-8 space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
                Chronological Tournament Blueprint
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                13 Official Championship Milestones (2024-25)
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Complete timeline mapping from the season proclamation in October 2024 to the Grand National Final Jubilee and Scholarship Gala.
              </p>
            </div>

            {/* Timeline Vertical Stack */}
            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {filteredEvents.map((ev, idx) => (
                <div key={ev.id} className="relative group">
                  {/* Timeline Dot Node */}
                  <div className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                    ev.isGrandFinal
                      ? 'bg-yellow-400 text-emerald-950 border-yellow-500 shadow-md ring-4 ring-yellow-400/20'
                      : 'bg-white text-emerald-900 border-emerald-600 shadow-xs group-hover:bg-emerald-700 group-hover:text-white'
                  }`}>
                    {ev.isGrandFinal ? <Trophy className="w-3.5 h-3.5 fill-current" /> : String(ev.milestoneNumber).padStart(2, '0')}
                  </div>

                  {/* Card Body */}
                  <div className={`rounded-2xl p-5 sm:p-6 border transition-all ${
                    ev.isGrandFinal
                      ? 'bg-gradient-to-r from-amber-50/90 via-emerald-50/50 to-amber-50/90 border-yellow-300 shadow-md'
                      : 'bg-slate-50/70 border-slate-200 hover:border-emerald-300 hover:bg-white hover:shadow-sm'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                          {ev.phase}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {formatFriendlyDate(ev.date)} {ev.endDate && `– ${formatFriendlyDate(ev.endDate)}`}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          ({ev.time})
                        </span>
                      </div>

                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        ev.category === 'deadline'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : ev.category === 'championship'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-slate-200/80 text-slate-800'
                      }`}>
                        {ev.tag}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      <h4 className="text-base sm:text-lg font-black text-slate-900">
                        {ev.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {ev.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                        <span className="flex items-center gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <strong className="text-slate-800">{ev.venue}</strong> ({ev.county} County)
                        </span>
                        {ev.targetAudience && (
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {ev.targetAudience}
                          </span>
                        )}
                      </div>

                      {/* Highlights Accordion List */}
                      {ev.highlights && ev.highlights.length > 0 && (
                        <div className="pt-2 space-y-1">
                          <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
                            Key Outcomes & Protocols:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {ev.highlights.map((h, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-200/70">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="leading-snug">{h}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadIcs(ev)}
                            className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Add to Calendar (.ics)</span>
                          </button>
                          <button
                            onClick={() => handleCopyEventDetails(ev)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Details</span>
                          </button>
                        </div>

                        <button
                          onClick={() => setInspectedEvent(ev)}
                          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Full Logistics Dossier</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EVENT LOGISTICS MODAL (INSPECTED EVENT DOSSIER) */}
      <AnimatePresence>
        {inspectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-200">
                    <Trophy className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Milestone #{inspectedEvent.milestoneNumber} of {inspectedEvent.totalMilestones}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {inspectedEvent.title}
                  </h3>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    {inspectedEvent.phase}
                  </p>
                </div>

                <button
                  onClick={() => setInspectedEvent(null)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Logistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Official Date</span>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{formatFriendlyDate(inspectedEvent.date)} {inspectedEvent.endDate && `– ${formatFriendlyDate(inspectedEvent.endDate)}`}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Scheduled Time</span>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-yellow-600" />
                    <span>{inspectedEvent.time}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1 sm:col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Venue & Location</span>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>{inspectedEvent.venue} ({inspectedEvent.county} County, Liberia)</span>
                  </div>
                </div>

                {inspectedEvent.targetAudience && (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Delegation / Audience</span>
                    <div className="font-medium text-slate-800 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{inspectedEvent.targetAudience}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Comprehensive Description */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Official Secretariat Overview:
                </span>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {inspectedEvent.description}
                </p>
              </div>

              {/* Highlights & Protocol Points */}
              {inspectedEvent.highlights && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    Key Outcomes & Milestones:
                  </span>
                  <div className="space-y-1.5">
                    {inspectedEvent.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Desk */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Secretariat Contact Desk</span>
                  <span className="font-bold text-emerald-950">{inspectedEvent.contactPerson || 'Youth For Change Liberia Forensics Secretariat'}</span>
                  <div className="text-emerald-700 text-[11px]">{inspectedEvent.contactEmail || 'info@youthforchange.org.lr'}</div>
                </div>

                <button
                  onClick={() => handleDownloadIcs(inspectedEvent)}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .ICS</span>
                </button>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  onClick={() => setInspectedEvent(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOURNAMENT FIXTURE MATCH DOSSIER MODAL */}
      <AnimatePresence>
        {inspectedFixture && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider border border-amber-200">
                    <Swords className="w-3.5 h-3.5 text-amber-700" />
                    <span>{inspectedFixture.roundName} • {inspectedFixture.county} County</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {inspectedFixture.teamA.schoolName} vs {inspectedFixture.teamB.schoolName}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Status: {inspectedFixture.status === 'completed' ? '✓ Concluded & Fed into System' : '⚔️ Scheduled Game'}
                  </p>
                </div>

                <button
                  onClick={() => setInspectedFixture(null)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Match Result Banner if Completed */}
              {inspectedFixture.status === 'completed' && (
                <div className="bg-emerald-950 rounded-2xl p-4 text-white border border-emerald-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider">Certified System Verdict</span>
                    <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-black">
                      <Trophy className="w-4 h-4 fill-current" />
                      <span>{inspectedFixture.winnerName || 'Winner Declared'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-800 text-xs">
                    <div className="bg-white/5 p-2 rounded-xl">
                      <span className="text-[10px] text-emerald-300 block">{inspectedFixture.teamA.schoolName}</span>
                      <strong className="text-sm text-white">{inspectedFixture.teamA.score} pts</strong>
                      <span className="text-[10px] text-slate-300 block">({inspectedFixture.teamA.ballots} ballots)</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl">
                      <span className="text-[10px] text-rose-300 block">{inspectedFixture.teamB.schoolName}</span>
                      <strong className="text-sm text-white">{inspectedFixture.teamB.score} pts</strong>
                      <span className="text-[10px] text-slate-300 block">({inspectedFixture.teamB.ballots} ballots)</span>
                    </div>
                  </div>
                  {inspectedFixture.scoreDifferential && (
                    <div className="text-[11px] text-emerald-200 italic pt-1 text-center">
                      Margin of Victory: {inspectedFixture.scoreDifferential}
                    </div>
                  )}
                </div>
              )}

              {/* Logistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Match Date</span>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{formatFriendlyDate(inspectedFixture.matchDate)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Scheduled Time</span>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-yellow-600" />
                    <span>{inspectedFixture.matchTime} GMT</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1 sm:col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Venue & Host Hall</span>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>{inspectedFixture.venue} ({inspectedFixture.county} County, Liberia)</span>
                  </div>
                </div>
              </div>

              {/* Assigned Motion */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Debate Motion:
                </span>
                <p className="text-xs sm:text-sm text-slate-800 italic bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 leading-relaxed font-serif">
                  "{inspectedFixture.motion}"
                </p>
              </div>

              {/* Adjudicators */}
              {inspectedFixture.adjudicators && inspectedFixture.adjudicators.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    Certified Adjudication Panel:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {inspectedFixture.adjudicators.map((adj, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200">
                        ⚖️ {adj}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadFixtureIcs(inspectedFixture)}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Add to Calendar (.ics)</span>
                  </button>
                  <button
                    onClick={() => handleCopyFixtureDetails(inspectedFixture)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Info</span>
                  </button>
                </div>

                <button
                  onClick={() => setInspectedFixture(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
