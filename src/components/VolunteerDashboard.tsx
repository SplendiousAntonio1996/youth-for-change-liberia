import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, CheckCircle2, User, Mail, 
  Phone, Plus, Trash2, AlertCircle, Sparkles, Filter, 
  Search, ShieldCheck, HeartHandshake, FileText, ArrowRight,
  RefreshCw, Check, X, Building, Award, ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  VolunteerOpportunity, 
  VolunteerRegistration, 
  INITIAL_VOLUNTEER_EVENTS, 
  INITIAL_USER_REGISTRATIONS 
} from '../data/volunteerData';
import { LIBERIA_COUNTIES } from '../data/schoolData';
import { NavTab, InvolvementApplication } from '../types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface VolunteerDashboardProps {
  setTab?: (tab: NavTab) => void;
}

const STORAGE_KEY_VOLUNTEER_REGS = 'yfc_volunteer_registrations';
const STORAGE_KEY_VOLUNTEER_USER = 'yfc_volunteer_active_user';

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({ setTab }) => {
  // Current logged in volunteer profile state
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    phone: string;
    county: string;
    rolePreference: string;
  }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOLUNTEER_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading saved volunteer user', e);
    }
    return {
      name: 'Abraham K. Mensah',
      email: 'abraham.mensah@gmail.com',
      phone: '+231 77 555 8921',
      county: 'Montserrado',
      rolePreference: 'Debate Adjudication & Mentorship'
    };
  });

  // Registrations state
  const [registrations, setRegistrations] = useState<VolunteerRegistration[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOLUNTEER_REGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error loading volunteer registrations', e);
    }
    return INITIAL_USER_REGISTRATIONS;
  });

  // Events catalogue state
  const [eventsList] = useState<VolunteerOpportunity[]>(INITIAL_VOLUNTEER_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [countyFilter, setCountyFilter] = useState('All');
  const [activeView, setActiveView] = useState<'my-events' | 'browse-events' | 'profile'>('my-events');
  
  // Registration modal / form state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [signupTargetEvent, setSignupTargetEvent] = useState<VolunteerOpportunity | null>(null);
  const [signupMode, setSignupMode] = useState<'In-Person' | 'Virtual / Hybrid'>('In-Person');
  const [signupRole, setSignupRole] = useState('Official Adjudicator / Judge');
  const [signupNotes, setSignupNotes] = useState('');
  const [signupSuccessMsg, setSignupSuccessMsg] = useState<string | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VOLUNTEER_REGS, JSON.stringify(registrations));
    } catch (e) {
      console.warn('Error saving volunteer registrations', e);
    }
  }, [registrations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VOLUNTEER_USER, JSON.stringify(currentUser));
    } catch (e) {
      console.warn('Error saving volunteer profile', e);
    }
  }, [currentUser]);

  // Handle Event Sign-up
  const handleOpenSignup = (event: VolunteerOpportunity) => {
    setSignupTargetEvent(event);
    setSignupRole(
      event.category === 'Debate Adjudication' 
        ? 'Lead Forensics Adjudicator' 
        : event.category === 'STEM Evaluation'
        ? 'STEM Prototype Evaluation Jury'
        : 'Event Operations Volunteer'
    );
    setSignupMode('In-Person');
    setSignupNotes('');
    setShowRegisterModal(true);
  };

  const handleConfirmSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupTargetEvent) return;

    // Check if already registered
    const existing = registrations.find(r => r.eventId === signupTargetEvent.id && r.email.toLowerCase() === currentUser.email.toLowerCase());
    if (existing) {
      alert(`You are already registered for "${signupTargetEvent.title}".`);
      setShowRegisterModal(false);
      return;
    }

    const newReg: VolunteerRegistration = {
      id: `reg-${Date.now()}`,
      eventId: signupTargetEvent.id,
      eventTitle: signupTargetEvent.title,
      volunteerName: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      roleAssigned: signupRole,
      county: signupTargetEvent.county,
      registeredAt: new Date().toISOString(),
      status: 'Confirmed',
      attendanceMode: signupMode,
      notes: signupNotes || 'Direct sign-up from Volunteer Dashboard'
    };

    // Save to Firestore involvementApplications for Secretariat Admin view
    try {
      await addDoc(collection(db, 'involvementApplications'), {
        type: 'volunteer',
        name: currentUser.name,
        email: currentUser.email.toLowerCase(),
        phone: currentUser.phone,
        county: signupTargetEvent.county,
        roleOrInterest: signupRole,
        eventId: signupTargetEvent.id,
        eventTitle: signupTargetEvent.title,
        attendanceMode: signupMode,
        message: signupNotes || `Registered for ${signupTargetEvent.title}`,
        status: 'approved',
        submittedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Could not sync volunteer application to Firestore:', err);
    }

    const updated = [newReg, ...registrations];
    setRegistrations(updated);
    setShowRegisterModal(false);
    setActiveView('my-events');
    setSignupSuccessMsg(`Successfully registered to support "${signupTargetEvent.title}"!`);

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      setSignupSuccessMsg(null);
    }, 5000);
  };

  // Cancel / Withdraw registration
  const handleCancelRegistration = (regId: string, eventTitle: string) => {
    if (window.confirm(`Are you sure you want to withdraw your volunteer registration for "${eventTitle}"?`)) {
      const filtered = registrations.filter(r => r.id !== regId);
      setRegistrations(filtered);
    }
  };

  // Reset to initial mock state
  const handleResetData = () => {
    if (window.confirm('Reset your volunteer dashboard back to the initial sample events and registrations?')) {
      setRegistrations(INITIAL_USER_REGISTRATIONS);
      localStorage.removeItem(STORAGE_KEY_VOLUNTEER_REGS);
    }
  };

  // Filter available events
  const filteredEvents = eventsList.filter(ev => {
    const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ev.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ev.county.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ev.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || ev.category === categoryFilter;
    const matchesCounty = countyFilter === 'All' || ev.county === countyFilter;
    return matchesSearch && matchesCategory && matchesCounty;
  });

  // Calculate user signed up events count
  const myEventsCount = registrations.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / User Welcome Strip */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-yellow-400 text-emerald-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Accredited Volunteer Portal
            </span>
            <span className="text-xs text-emerald-200 font-mono">
              Status: Active Civic Leader
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome back, {currentUser.name}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
            Manage your registered championship judging slots, review reporting times and venues, or sign up for new regional tournament fixtures across Liberia.
          </p>
        </div>

        {/* User Summary Stats Card */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 p-3 sm:p-4 rounded-2xl shrink-0">
          <div className="text-center px-3 border-r border-white/20">
            <div className="text-2xl sm:text-3xl font-black text-yellow-400 font-mono">{myEventsCount}</div>
            <div className="text-[10px] uppercase font-bold text-emerald-200">Signed Up</div>
          </div>
          <div className="text-center px-3 border-r border-white/20">
            <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">{eventsList.length}</div>
            <div className="text-[10px] uppercase font-bold text-emerald-200">Available</div>
          </div>
          <div className="text-center px-3">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">15</div>
            <div className="text-[10px] uppercase font-bold text-emerald-200">Counties</div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {signupSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm animate-in slide-in-from-top duration-300 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{signupSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setSignupSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dashboard View Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1">
          <button
            id="volunteer-tab-my-events"
            onClick={() => setActiveView('my-events')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'my-events'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-slate-600 hover:text-emerald-900 hover:bg-slate-200/60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-yellow-400" />
            <span>My Registered Events ({myEventsCount})</span>
          </button>
          
          <button
            id="volunteer-tab-browse-events"
            onClick={() => setActiveView('browse-events')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'browse-events'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-slate-600 hover:text-emerald-900 hover:bg-slate-200/60'
            }`}
          >
            <Calendar className="w-4 h-4 text-yellow-400" />
            <span>Browse All Volunteer Slots ({eventsList.length})</span>
          </button>

          <button
            id="volunteer-tab-profile"
            onClick={() => setActiveView('profile')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'profile'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-slate-600 hover:text-emerald-900 hover:bg-slate-200/60'
            }`}
          >
            <User className="w-4 h-4 text-yellow-400" />
            <span>Volunteer Profile & Roles</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetData}
            title="Reset to default mock registrations"
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MY REGISTERED EVENTS */}
      {activeView === 'my-events' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-800" />
                <span>Your Upcoming Confirmed Commitments</span>
              </h3>
              <p className="text-xs text-slate-500">
                Review your reporting dates, assigned adjudication or support positions, and venue locations.
              </p>
            </div>

            <button
              onClick={() => setActiveView('browse-events')}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-bold px-3.5 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-emerald-800" />
              <span>Sign Up for Another Event</span>
            </button>
          </div>

          {registrations.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Calendar className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-base font-bold text-slate-800">No events registered yet</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You haven't signed up for any championship judging or event support fixtures yet. Browse open slots across Liberia's 15 counties to get started!
                </p>
              </div>
              <button
                onClick={() => setActiveView('browse-events')}
                className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-yellow-400" />
                <span>Explore Volunteer Opportunities</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {registrations.map(reg => {
                const eventDetails = eventsList.find(e => e.id === reg.eventId);
                return (
                  <div 
                    key={reg.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4 relative flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{reg.status}</span>
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Mode: <strong>{reg.attendanceMode}</strong>
                        </span>
                      </div>

                      {/* Event Title */}
                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {reg.eventTitle}
                      </h4>

                      {/* Role Highlight */}
                      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                          Assigned Role & Responsibility
                        </div>
                        <div className="text-xs font-bold text-slate-900">
                          {reg.roleAssigned}
                        </div>
                      </div>

                      {/* Event Details Grid */}
                      <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                        {eventDetails && (
                          <>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Date: <strong>{eventDetails.date}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Reporting Time: <strong>{eventDetails.time}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Venue: <strong>{eventDetails.venue}</strong> ({reg.county} County)</span>
                            </div>
                          </>
                        )}

                        {reg.notes && (
                          <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                            Notes: "{reg.notes}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Reg ID: {reg.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCancelRegistration(reg.id, reg.eventTitle)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Withdraw Registration</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: BROWSE ALL VOLUNTEER OPPORTUNITIES */}
      {activeView === 'browse-events' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-800" />
                <span>Upcoming Championship Volunteer Opportunities</span>
              </h3>
              <p className="text-xs text-slate-500">
                Select an open tournament or symposium fixture and register to serve as an adjudicator, timer, judge, or mentor.
              </p>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search event name, venue, county..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
              >
                <option value="All">All Categories ({eventsList.length})</option>
                <option value="Debate Adjudication">Debate Adjudication</option>
                <option value="STEM Evaluation">STEM Evaluation</option>
                <option value="County Logistics">County Logistics</option>
                <option value="Youth Mentorship">Youth Mentorship</option>
                <option value="Media & Photography">Media & Photography</option>
                <option value="Event Operations">Event Operations</option>
              </select>
            </div>

            <div>
              <select
                value={countyFilter}
                onChange={e => setCountyFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
              >
                <option value="All">All Counties</option>
                {LIBERIA_COUNTIES.map(c => (
                  <option key={c.county} value={c.county}>{c.county} County</option>
                ))}
              </select>
            </div>
          </div>

          {/* Opportunities Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map(event => {
              const isUserRegistered = registrations.some(r => r.eventId === event.id);
              const slotsAvailable = event.slotsTotal - event.slotsFilled;

              return (
                <div 
                  key={event.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Status & Category */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${event.badgeColor}`}>
                        {event.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        event.status === 'Urgent' 
                          ? 'bg-rose-100 text-rose-800' 
                          : event.status === 'Filling Fast' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {event.title}
                    </h4>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {event.description}
                    </p>

                    {/* Quick Metadata */}
                    <div className="space-y-1 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{event.date} • {event.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{event.venue}, {event.county}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Lead: {event.leadCoordinator}</span>
                      </div>
                    </div>

                    {/* Required Skills Chips */}
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Desired Skills:</div>
                      <div className="flex flex-wrap gap-1">
                        {event.requiredSkills.map((sk, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer & Action */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Slots: <strong>{event.slotsFilled}/{event.slotsTotal}</strong> filled</span>
                      <span className="text-emerald-700 font-semibold">{slotsAvailable} slots remaining</span>
                    </div>

                    {isUserRegistered ? (
                      <div className="w-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Already Registered</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenSignup(event)}
                        className="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-yellow-400" />
                        <span>Sign Up to Support</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: PROFILE & ACCREDITATIONS */}
      {activeView === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              Registered Volunteer Profile
            </h3>
            <p className="text-xs text-slate-500">
              Update your contact details, regional assignment preferences, and accredited forensics role.
            </p>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              alert('Volunteer profile updated successfully!');
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={currentUser.name}
                onChange={e => setCurrentUser({ ...currentUser, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Primary Email Address</label>
              <input
                type="email"
                value={currentUser.email}
                onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number (Liberian / WhatsApp)</label>
              <input
                type="tel"
                value={currentUser.phone}
                onChange={e => setCurrentUser({ ...currentUser, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Home County Base</label>
              <select
                value={currentUser.county}
                onChange={e => setCurrentUser({ ...currentUser, county: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {LIBERIA_COUNTIES.map(c => (
                  <option key={c.county} value={c.county}>{c.county} County</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Primary Focus & Role Preference</label>
              <input
                type="text"
                value={currentUser.rolePreference}
                onChange={e => setCurrentUser({ ...currentUser, rolePreference: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2 pt-2 flex items-center justify-end">
              <button
                type="submit"
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SIGNUP MODAL DIALOG */}
      {showRegisterModal && signupTargetEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-slate-900"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-base">Sign Up to Support Event</h3>
              </div>
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="p-1 hover:bg-emerald-800 rounded-lg text-emerald-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSignup} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Selected Event</div>
                <div className="font-bold text-slate-900 text-sm">{signupTargetEvent.title}</div>
                <div className="text-slate-500 text-[11px]">
                  {signupTargetEvent.date} • {signupTargetEvent.venue} ({signupTargetEvent.county} County)
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Volunteer Name</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.name}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-700 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Specific Volunteer Role / Assignment *</label>
                <select
                  value={signupRole}
                  onChange={e => setSignupRole(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="Lead Forensics Adjudicator">Lead Forensics Adjudicator</option>
                  <option value="Associate Judge / Scoring Officer">Associate Judge / Scoring Officer</option>
                  <option value="Round Timekeeper & Marshal">Round Timekeeper & Marshal</option>
                  <option value="STEM Prototype Evaluation Jury">STEM Prototype Evaluation Jury</option>
                  <option value="Student Team Mentor">Student Team Mentor</option>
                  <option value="County Registration & Protocol Desk">County Registration & Protocol Desk</option>
                  <option value="Media, Photography & Stream Crew">Media, Photography & Stream Crew</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Participation Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignupMode('In-Person')}
                    className={`p-2.5 rounded-xl border font-bold text-center cursor-pointer transition-colors ${
                      signupMode === 'In-Person'
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    In-Person (On-Site)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupMode('Virtual / Hybrid')}
                    className={`p-2.5 rounded-xl border font-bold text-center cursor-pointer transition-colors ${
                      signupMode === 'Virtual / Hybrid'
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Virtual / Hybrid
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Special Notes / Experience (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g., Previous judging experience, travel requirements..."
                  value={signupNotes}
                  onChange={e => setSignupNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-yellow-400" />
                  <span>Confirm Registration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
