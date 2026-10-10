import React, { useState } from 'react';
import { 
  MapPin, Phone, Mail, Clock, MessageSquare, 
  Send, CheckCircle2, ChevronDown, ChevronUp, Globe, ShieldCheck 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '../context/ToastContext';

export const ContactView: React.FC = () => {
  const { success } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
    success(`Thank you ${form.name ? form.name : ''}! Your message has been routed to the YOUTH for Change national secretariat.`, 'Message Delivered');
  };

  const faqs = [
    {
      q: 'How can a high school register for the National Debate Championship?',
      a: 'Any accredited secondary school in Liberia can register through our "Get Involved > For Schools" tab or by visiting their County Regional Coordinator. Registration is completely free for public and community high schools.'
    },
    {
      q: 'Are high schools from outside Monrovia eligible to participate?',
      a: 'Yes, 100%! All 15 counties participate. County preliminary tournaments are held locally in each county capital, and county winners receive full transport and lodging stipends to compete at the Grand Finals in Monrovia.'
    },
    {
      q: 'What are the rules and guidelines for the STEM Challenge?',
      a: 'Teams must consist of 3 to 5 high school students and one faculty teacher mentor. Inventions must solve a verifiable community challenge (clean water, solar energy, agro-processing, or waste reduction) using locally sourced components where feasible.'
    },
    {
      q: 'How are debate judges selected and trained?',
      a: 'Judges are certified through the Youth For Change Adjudication Academy. Panelists include practicing attorneys, university forensics faculty, debate alumni, and civic leaders.'
    },
    {
      q: 'How can international donors or diaspora organizations support?',
      a: 'Donors can sponsor school debate kits, fund laboratory STEM grants, underwrite student scholarships, or provide broadcast airtime for rural radio broadcasts.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-extrabold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
          Get in Touch
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
          Contact YOUTH for Change .INC
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Our headquarters is in Monrovia, with regional coordinators stationed in all 15 political subdivisions across Liberia.
        </p>
      </div>

      {/* Main Grid: Contact Cards & Message Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Office Locations & Channels */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Headquarters Card */}
          <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400 bg-white/10 px-2.5 py-1 rounded">
              National Secretariat Headquarters
            </span>
            <h2 className="text-xl font-bold text-white">Monrovia Executive Office</h2>
            <div className="space-y-3 text-xs text-slate-200">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <span>Tubman Boulevard, Old Congo Town (Opposite Ministerial Complex), Monrovia, Liberia</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+231 (0) 777 555 123 / +231 (0) 886 444 890</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-yellow-300 shrink-0" />
                <span>info@youthforchangeliberia.org</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>Monday – Friday: 8:30 AM – 5:30 PM GMT</span>
              </div>
            </div>
          </div>

          {/* Regional Hubs */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Key Regional Coordinator Hubs
            </h3>
            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong className="text-slate-900 block font-bold">Central Liberia Hub (Bong & Nimba)</strong>
                <span>Gbarnga Administrative Center & Ganta City Center</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong className="text-slate-900 block font-bold">Southeastern Hub (Maryland, Sinoe, Grand Gedeh)</strong>
                <span>Harper City, Green Street, Maryland County</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <strong className="text-slate-900 block font-bold">Western Hub (Grand Cape Mount, Bomi, Gbarpolu)</strong>
                <span>Robertsport City Youth Resource Center</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Direct Message Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">Instant Inquiry Desk</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Send Us a Direct Message</h2>
            <p className="text-xs text-slate-500 mt-0.5">We respond within 24 hours.</p>
          </div>

          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-emerald-950">Message Sent Successfully</h3>
              <p className="text-xs text-emerald-800">
                Thank you for contacting Youth For Change Liberia. Our communications desk will reach out to you promptly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: '', email: '', subject: '', message: '' });
                }}
                className="px-5 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs cursor-pointer hover:bg-emerald-900"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Fatu Kollie"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Your Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g., fkollie@yahoo.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Request for High School Debate Starter Kit"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Message Details *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write your question, feedback, or request here..."
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmit Direct Message</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Frequently Asked Questions (FAQ) Accordion */}
      <div className="bg-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">Help & Clarifications</span>
          <h3 className="text-2xl font-black text-slate-900">Frequently Asked Questions</h3>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-xs sm:text-sm cursor-pointer hover:bg-slate-50"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-800 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
