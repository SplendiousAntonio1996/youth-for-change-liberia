import React, { useState } from 'react';
import { X, Bell, CheckCircle2, ShieldCheck, Mail, Phone, User, Building2 } from 'lucide-react';
import { LIBERIA_COUNTIES } from '../data/schoolData';
import { useToast } from '../context/ToastContext';

interface CoachAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoachAlertsModal: React.FC<CoachAlertsModalProps> = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [selectedSchool, setSelectedSchool] = useState('');
  const [coachName, setCoachName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool || !coachName || !phone) {
      toast.error('Please complete all required fields.', 'Missing Information');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      toast.success(
        `Alerts activated for ${coachName} (${selectedSchool})! You'll receive instant SMS updates for all rounds.`,
        'Coach Alerts Active'
      );
    }, 600);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSelectedSchool('');
    setCoachName('');
    setPhone('');
    setEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-emerald-600 overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#063d2e] text-white p-6 sm:p-7 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-[11px] font-bold text-red-400 tracking-widest uppercase mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>COACH FIXTURE ALERTS</span>
          </div>
          <h2 className="font-condensed font-black text-3xl sm:text-4xl text-white tracking-tight uppercase leading-none">
            NEVER MISS A ROUND
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-2 leading-relaxed">
            Direct SMS and WhatsApp fixture dispatch for faculty coaches, team patrons, and principal offices across Liberia's 15 counties.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-7">
          {isSubmitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-condensed font-black text-2xl text-slate-900 uppercase">
                  Alerts Activated!
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Coach <strong>{coachName}</strong> representing <strong>{selectedSchool}</strong> is registered. You will receive real-time notifications when your fixtures are set, rescheduled, or scores locked.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-1.5 font-mono">
                <div className="text-slate-500 text-[10px] uppercase font-sans font-bold">Registered Dispatch Details:</div>
                <div className="text-slate-800 font-bold">School: {selectedSchool}</div>
                <div className="text-slate-800">Phone: {phone}</div>
                {email && <div className="text-slate-800">Email: {email}</div>}
                <div className="text-emerald-700 font-sans text-[11px] font-bold flex items-center gap-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Anti-bias verified fixture dispatch active
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 bg-[#063d2e] hover:bg-[#04281e] text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Select your school <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="">Select your school</option>
                  <optgroup label="Montserrado Metro (Zone A & E)">
                    <option value="College of West Africa">College of West Africa (CWA)</option>
                    <option value="B.W. Harris Episcopal High">B.W. Harris Episcopal High</option>
                    <option value="St. Teresa's Convent">St. Teresa's Convent</option>
                    <option value="Paynesville SDA High">Paynesville SDA High</option>
                    <option value="Len Millar High School">Len Millar High School</option>
                    <option value="Monrovia Demonstration High">Monrovia Demonstration High</option>
                    <option value="J.J. Roberts United Methodist">J.J. Roberts United Methodist</option>
                  </optgroup>
                  <optgroup label="Central Liberia (Zone B)">
                    <option value="Kakata Rural Teachers High">Kakata Rural Teachers High (KRTTI)</option>
                    <option value="Gboveh High School">Gboveh High School (Gbarnga)</option>
                    <option value="Cuttington Campus High">Cuttington Campus High (Suakoko)</option>
                    <option value="Booker Washington Institute">Booker Washington Institute (BWI)</option>
                  </optgroup>
                  <optgroup label="Northern & Eastern (Zone C)">
                    <option value="Ganta United Methodist High">Ganta United Methodist High</option>
                    <option value="Voinjama Multilateral High">Voinjama Multilateral High (Lofa)</option>
                    <option value="Sanniquellie Central High">Sanniquellie Central High</option>
                  </optgroup>
                  <optgroup label="Southeastern & Western (Zone D & E)">
                    <option value="Tubman High School">Tubman High School (Harper, Maryland)</option>
                    <option value="Bishop Juwle High School">Bishop Juwle High School</option>
                    <option value="Bassa High School">Bassa High School (Buchanan)</option>
                    <option value="Robertsport High School">Robertsport High School (Grand Cape Mount)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Coach name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                    required
                    placeholder="e.g. Coach Emmanuel Tamba"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Phone (e.g. +231 77 000 0000) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+231 77 000 0000"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coach@school.edu.lr"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#063d2e] hover:bg-[#04281e] text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Activating alerts...' : 'Get alerts'}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 text-center leading-normal pt-1">
                You'll be notified when fixtures are published, rescheduled or results are posted.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
