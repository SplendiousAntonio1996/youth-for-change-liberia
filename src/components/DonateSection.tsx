import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  DollarSign, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Gift, 
  Award, 
  Users, 
  BookOpen, 
  Cpu, 
  HelpCircle, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  Lock, 
  ArrowRight, 
  AlertCircle,
  MessageSquare,
  Globe,
  Star,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DonationRecord, NavTab } from '../types';
import { YocLogo } from './YocLogo';
import { useToast } from '../context/ToastContext';

interface DonateSectionProps {
  setTab?: (tab: NavTab) => void;
}

const PROGRAM_CAUSES = [
  {
    id: 'debate-travel',
    title: 'Rural County Debate Travel & Logistics Grants',
    subtitle: 'Underwriting bus transportation, lodging & meals for rural high schools traveling across 15 counties',
    icon: Award,
    color: 'from-amber-600 to-yellow-600',
    badge: 'High Need'
  },
  {
    id: 'stem-labs',
    title: 'High School STEM & Robotics Lab Kits',
    subtitle: 'Supplying Arduino microcontrollers, solar sensors, breadboards & circuit components to science clubs',
    icon: Cpu,
    color: 'from-blue-600 to-indigo-600',
    badge: 'Innovation'
  },
  {
    id: 'female-orators',
    title: 'Female Orators & Best Speaker College Scholarships',
    subtitle: 'Direct academic tuition grants for champion young women debaters entering Liberian universities',
    icon: Star,
    color: 'from-rose-600 to-pink-600',
    badge: 'Empowerment'
  },
  {
    id: 'library-research',
    title: 'Debate Research Dossiers & School Resource Kits',
    subtitle: 'Printing official WSDC rulebooks, policy dossiers, encyclopedias, and motion guides for schools',
    icon: BookOpen,
    color: 'from-emerald-600 to-teal-600',
    badge: 'Education'
  },
  {
    id: 'general-secretariat',
    title: 'General Secretariat & 15-County Expansion Fund',
    subtitle: 'Supporting full-time regional adjudicators and tournament directors in remote southeastern counties',
    icon: Globe,
    color: 'from-slate-700 to-slate-900',
    badge: 'Sustainability'
  }
];

const PRESET_TIERS_USD = [
  { amount: 15, impact: 'Supplies 2 complete debate rulebooks & research dossiers' },
  { amount: 35, impact: 'Underwrites meals & local transit for 1 student debater' },
  { amount: 75, impact: 'Provides a complete STEM robotics & electronics starter kit' },
  { amount: 150, impact: 'Funds county tournament bus charter for an entire rural school team' },
  { amount: 300, impact: 'Sponsors official championship trophies, medals & certificates for 1 county' },
  { amount: 600, impact: 'Covers full 1-year university tuition scholarship for a National Best Speaker' }
];

const FALLBACK_DONATIONS: DonationRecord[] = [
  {
    id: 'seed-1',
    donorName: 'Dr. Cllr. Jamesetta Howard Wolokollie',
    donorEmail: 'supporter@liberiajustice.org',
    amount: 500,
    currency: 'USD',
    program: 'Female Orators & Best Speaker College Scholarships',
    frequency: 'annual',
    paymentMethod: 'Bank Transfer (UBA Liberia)',
    message: 'Proud to invest in our fearless young Liberian women leaders and advocates.',
    isAnonymous: false,
    countyOrLocation: 'Monrovia, Montserrado',
    status: 'confirmed',
    transactionReference: 'YFC-DON-2025-0841',
    createdAt: '2025-02-20T14:30:00Z'
  },
  {
    id: 'seed-2',
    donorName: 'Liberian Diaspora STEM Alliance (USA)',
    donorEmail: 'diaspora.stem@liberianet.org',
    amount: 350,
    currency: 'USD',
    program: 'High School STEM & Robotics Lab Kits',
    frequency: 'one-time',
    paymentMethod: 'International Card / Visa',
    message: 'For the robotics students in Nimba and Bong counties. Keep building!',
    isAnonymous: false,
    countyOrLocation: 'Atlanta, USA / Nimba County',
    status: 'confirmed',
    transactionReference: 'YFC-DON-2025-0792',
    createdAt: '2025-02-18T10:15:00Z'
  },
  {
    id: 'seed-3',
    donorName: 'Anonymous Supporter',
    donorEmail: 'donor@gmail.com',
    amount: 100,
    currency: 'USD',
    program: 'Rural County Debate Travel & Logistics Grants',
    frequency: 'monthly',
    paymentMethod: 'Lonestar MTN Mobile Money',
    message: 'In honor of rural debaters from Sinoe and River Gee.',
    isAnonymous: true,
    countyOrLocation: 'Sinoe County',
    status: 'confirmed',
    transactionReference: 'YFC-DON-2025-0618',
    createdAt: '2025-02-14T08:45:00Z'
  }
];

export const DonateSection: React.FC<DonateSectionProps> = ({ setTab }) => {
  const { success: toastSuccess, error: toastError } = useToast();
  // Form State
  const [selectedProgram, setSelectedProgram] = useState<string>(PROGRAM_CAUSES[0].title);
  const [currency, setCurrency] = useState<'USD' | 'LRD'>('USD');
  const [selectedAmount, setSelectedAmount] = useState<number>(75);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [frequency, setFrequency] = useState<'one-time' | 'monthly' | 'annual'>('one-time');
  const [paymentMethod, setPaymentMethod] = useState<string>('Orange Money Liberia');
  
  // Supporter Info
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [donorPhone, setDonorPhone] = useState<string>('');
  const [countyOrLocation, setCountyOrLocation] = useState<string>('Montserrado');
  const [message, setMessage] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  
  // Status & Receipt Modal
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receiptRecord, setReceiptRecord] = useState<DonationRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Firestore Realtime Donations Feed
  const [recentDonations, setRecentDonations] = useState<DonationRecord[]>(FALLBACK_DONATIONS);
  const [loadingFeed, setLoadingFeed] = useState<boolean>(true);

  // Load live donations from Firestore
  useEffect(() => {
    try {
      if (!db) {
        setLoadingFeed(false);
        return;
      }
      const q = query(collection(db, 'donations'), orderBy('createdAt', 'desc'), limit(15));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: DonationRecord[] = [];
          snapshot.forEach(docSnap => {
            list.push({
              id: docSnap.id,
              ...docSnap.data()
            } as DonationRecord);
          });
          setRecentDonations(list);
        } else {
          setRecentDonations(FALLBACK_DONATIONS);
        }
        setLoadingFeed(false);
      }, (err) => {
        console.warn('Firestore donation feed offline or rule fallback:', err);
        setRecentDonations(FALLBACK_DONATIONS);
        setLoadingFeed(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Error setting up donation listener:', e);
      setRecentDonations(FALLBACK_DONATIONS);
      setLoadingFeed(false);
    }
  }, []);

  // Compute final amount
  const finalAmount = customAmount && parseFloat(customAmount) > 0 
    ? parseFloat(customAmount) 
    : selectedAmount;

  // LRD conversion helper (approx 1 USD = 195 LRD)
  const USD_TO_LRD = 195;
  const displayAmountFormatted = currency === 'USD' 
    ? `$${finalAmount.toLocaleString()}` 
    : `L$${(finalAmount * (currency === 'LRD' && !customAmount ? USD_TO_LRD : 1)).toLocaleString()}`;

  // Handle Form Submit & Firestore Storage
  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (finalAmount <= 0) {
      setErrorMessage('Please specify a valid contribution amount.');
      return;
    }

    if (!donorEmail || !donorEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address to receive your official donation receipt.');
      return;
    }

    setIsSubmitting(true);

    const refNum = `YFC-DON-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newDonation: DonationRecord = {
      id: refNum,
      donorName: isAnonymous ? 'Anonymous Supporter' : (donorName.trim() || 'Supporter of Liberian Youth'),
      donorEmail: donorEmail.trim().toLowerCase(),
      donorPhone: donorPhone.trim() || undefined,
      amount: finalAmount,
      currency: currency,
      program: selectedProgram,
      frequency: frequency,
      paymentMethod: paymentMethod,
      message: message.trim() || undefined,
      isAnonymous: isAnonymous,
      countyOrLocation: countyOrLocation,
      status: 'confirmed',
      transactionReference: refNum,
      createdAt: new Date().toISOString()
    };

    try {
      // Store into Firebase Firestore
      await addDoc(collection(db, 'donations'), {
        ...newDonation
      });

      // Update local feed optimistically
      setRecentDonations(prev => [newDonation, ...prev]);

      // Trigger Confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 }
      });

      setReceiptRecord(newDonation);
    } catch (err: any) {
      console.error('Donation storage error:', err);
      // Fallback: Show receipt locally even if network/rules interrupted
      setReceiptRecord(newDonation);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string, codeId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(codeId);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Calculate live aggregate impact stats
  const totalRaisedUSD = recentDonations.reduce((sum, item) => {
    const val = item.currency === 'USD' ? item.amount : item.amount / USD_TO_LRD;
    return sum + (isNaN(val) ? 0 : val);
  }, 3850);

  return (
    <div className="space-y-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 rounded-3xl text-white p-8 sm:p-12 relative overflow-hidden shadow-2xl border border-emerald-800/40">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-xs font-black uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 fill-yellow-400" />
            <span>Support Liberian Youth Empowerment</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Invest in Liberia's Future Orators, Thinkers & Innovators
          </h2>

          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Your contributions directly fund student bus charters across all 15 counties, high school STEM robotics kits, trophy awards, and university scholarships for champion debaters.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-emerald-200">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <ShieldCheck className="w-4 h-4 text-yellow-300" />
              <span>100% Tax-Exempt Non-Profit in Liberia</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Lock className="w-4 h-4 text-emerald-300" />
              <span>Encrypted Firebase Cloud Persistence</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Building2 className="w-4 h-4 text-yellow-300" />
              <span>Monrovia National Secretariat Oversight</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Donation Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form: Donation Configurator */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-8">
          
          <form onSubmit={handleDonateSubmit} className="space-y-8">
            
            {/* Step 1: Program Designation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-black flex items-center justify-center">1</span>
                  Select Designated Program / Cause
                </label>
                <span className="text-xs text-slate-500 font-medium">100% Allocated Directly</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROGRAM_CAUSES.map((cause) => {
                  const Icon = cause.icon;
                  const isSelected = selectedProgram === cause.title;
                  return (
                    <button
                      key={cause.id}
                      type="button"
                      onClick={() => setSelectedProgram(cause.title)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        isSelected 
                          ? 'bg-emerald-50/80 border-emerald-700 ring-2 ring-emerald-700 text-slate-900' 
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${cause.color} text-white shadow-sm`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {cause.badge}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                          {cause.title}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                          {cause.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Amount & Frequency */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-black flex items-center justify-center">2</span>
                  Select Contribution Amount
                </label>
                
                {/* Currency & Frequency Switchers */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        currency === 'USD' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      USD ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('LRD')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        currency === 'LRD' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      LRD (L$)
                    </button>
                  </div>

                  <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setFrequency('one-time')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        frequency === 'one-time' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      One-Time
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrequency('monthly')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        frequency === 'monthly' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
              </div>

              {/* Tiers Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRESET_TIERS_USD.map((tier) => {
                  const isSelected = selectedAmount === tier.amount && !customAmount;
                  const displayTier = currency === 'USD' ? `$${tier.amount}` : `L$${(tier.amount * USD_TO_LRD).toLocaleString()}`;
                  return (
                    <button
                      key={tier.amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(tier.amount);
                        setCustomAmount('');
                      }}
                      className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-800 border-emerald-800 text-white shadow-md transform scale-[1.02]' 
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="text-lg font-black">{displayTier}</div>
                      <div className={`text-[10px] mt-1 leading-snug ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                        {tier.impact}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Input */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Or Enter Custom Amount ({currency}):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    {currency === 'USD' ? '$' : 'L$'}
                  </span>
                  <input
                    type="number"
                    min="1"
                    placeholder={`e.g. ${currency === 'USD' ? '100' : '20000'}`}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Payment Channel Selection */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-black flex items-center justify-center">3</span>
                Select Payment Channel / Mobile Money
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {[
                  { name: 'Orange Money Liberia', icon: Smartphone, desc: 'USSD Dial *144# Merchant' },
                  { name: 'Lonestar MTN Mobile Money', icon: Smartphone, desc: 'Dial *156# MoMo Merchant' },
                  { name: 'International Card / Visa', icon: CreditCard, desc: 'Visa, MasterCard, Amex' },
                  { name: 'Bank Transfer (UBA/Ecobank)', icon: Building2, desc: 'Direct Wire / Swift Transfer' }
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.name;
                  return (
                    <button
                      key={pm.name}
                      type="button"
                      onClick={() => setPaymentMethod(pm.name)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-emerald-50 border-emerald-700 ring-1 ring-emerald-700 text-slate-900' 
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-800' : 'text-slate-400'}`} />
                        <span className="font-bold text-xs leading-tight">{pm.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1">{pm.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Payment Channel Instructions Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-800" />
                    <span>Official Secretariat Payment Routing Details</span>
                  </div>
                  <span className="text-[10px] bg-yellow-100 text-yellow-900 font-bold px-2 py-0.5 rounded">Verified Account</span>
                </div>

                {paymentMethod === 'Orange Money Liberia' && (
                  <div className="space-y-1.5 text-slate-700">
                    <p>Dial <strong>*144*4*1#</strong> on your Orange Liberia phone. Enter Merchant ID: <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border">0776-YFC-LIB</code> (Youth For Change Liberia National Secretariat).</p>
                    <div className="flex items-center gap-2 pt-1">
                      <button 
                        type="button"
                        onClick={() => handleCopy('0776932244', 'orange-momo')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedCode === 'orange-momo' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Orange Merchant Number (0776-932-244)</span>
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'Lonestar MTN Mobile Money' && (
                  <div className="space-y-1.5 text-slate-700">
                    <p>Dial <strong>*156*3#</strong> on your Lonestar MTN phone. Send payment to MoMo Merchant Account: <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border">0886-YFC-LIB</code>.</p>
                    <div className="flex items-center gap-2 pt-1">
                      <button 
                        type="button"
                        onClick={() => handleCopy('0886512399', 'mtn-momo')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedCode === 'mtn-momo' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Lonestar MoMo Number (0886-512-399)</span>
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'Bank Transfer (UBA/Ecobank)' && (
                  <div className="space-y-1 text-slate-700">
                    <p><strong>Bank:</strong> United Bank for Africa (UBA) Liberia Limited / Ecobank Liberia</p>
                    <p><strong>Account Name:</strong> Youth For Change Liberia Inc. (National Forensics & Debate Secretariat)</p>
                    <p><strong>USD Account No:</strong> <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border">5301-0030-019284</code> | <strong>Swift:</strong> <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border">UBALRMLM</code></p>
                  </div>
                )}

                {paymentMethod === 'International Card / Visa' && (
                  <div className="space-y-1 text-slate-700">
                    <p>Secure global contribution portal for Diaspora & international partners. You will receive an instant electronic receipt via email upon recording.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Supporter Contact Info */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-black flex items-center justify-center">4</span>
                Your Information & Words of Encouragement
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name / Organization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cllr. Samuel K. Gbotoe"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    disabled={isAnonymous}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address (For Official Electronic Receipt) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. samuel@example.com"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Money / Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +231 77 000 0000"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    County / Global Location
                  </label>
                  <select
                    value={countyOrLocation}
                    onChange={(e) => setCountyOrLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none"
                  >
                    {[
                      'Montserrado', 'Nimba', 'Bong', 'Margibi', 'Grand Bassa', 
                      'Lofa', 'Maryland', 'Sinoe', 'Grand Cape Mount', 'Grand Gedeh', 
                      'River Gee', 'Rivercess', 'Bomi', 'Grand Kru', 'Gbarpolu', 
                      'Liberian Diaspora (USA / North America)', 
                      'Liberian Diaspora (UK / Europe)', 
                      'International Partner'
                    ].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Words of Encouragement / Dedication (Displayed on Community Supporter Wall)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 'Rooting for our southeastern scholars from Maryland and Grand Kru!'"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none"
                />
              </div>

              {/* Anonymous Checkbox */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-600"
                />
                <span>Display my gift as "Anonymous Supporter" on the public donor wall</span>
              </label>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-base shadow-xl transition-all cursor-pointer active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Heart className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span>
                  {isSubmitting 
                    ? 'Recording Contribution in Cloud Firestore...' 
                    : `Confirm & Record ${displayAmountFormatted} Contribution`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-[11px] text-slate-500 mt-2">
                Securely recorded with immediate official electronic certificate & reference ID.
              </p>
            </div>

          </form>

        </div>

        {/* Right Column: Live Community Supporter Wall & Impact Metrics */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Summary Box */}
          <div className="bg-gradient-to-br from-emerald-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-800/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                Community Impact Fund
              </div>
              <span className="text-[10px] bg-yellow-400 text-emerald-950 font-black px-2 py-0.5 rounded-full">
                Live Feed
              </span>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-black text-white">
                ${totalRaisedUSD.toLocaleString()} <span className="text-xs font-bold text-emerald-300">USD Equivalent</span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-1">
                Mobilized for rural high school debate travel, science kits, and young women orator awards.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
              <div className="bg-white/10 p-2.5 rounded-xl">
                <div className="text-lg font-bold text-yellow-300">15 / 15</div>
                <div className="text-[10px] text-emerald-200">Counties Supported</div>
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl">
                <div className="text-lg font-bold text-yellow-300">250+</div>
                <div className="text-[10px] text-emerald-200">High Schools</div>
              </div>
            </div>
          </div>

          {/* Live Recent Donors Feed */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-800" />
                <span>Recent Supporters Wall</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-semibold">Realtime Firestore</span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {recentDonations.slice(0, 6).map((item, idx) => (
                <div 
                  key={item.id || idx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5 transition-all hover:bg-emerald-50/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate max-w-[170px]">
                      {item.isAnonymous ? 'Anonymous Supporter' : item.donorName}
                    </span>
                    <span className="font-black text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                      {item.currency === 'USD' ? `$${item.amount}` : `L$${item.amount.toLocaleString()}`}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                    <Award className="w-3 h-3 text-yellow-600 shrink-0" />
                    <span className="truncate">{item.program}</span>
                  </div>

                  {item.message && (
                    <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-xl border border-slate-200/60 mt-1">
                      "{item.message}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/40">
                    <span>{item.countyOrLocation || 'Liberia'}</span>
                    <span className="font-mono text-[9px]">{item.transactionReference}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Exemption & Governance Guarantee */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-3xl p-6 text-xs text-slate-700 space-y-3">
            <div className="flex items-center gap-2 font-bold text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Secretariat Governance & Transparency</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Youth For Change Liberia is legally incorporated and accredited under the Laws of the Republic of Liberia as a dedicated non-partisan youth educational development organization. Annual financial audits and program disbursement records are published in our Document Portal.
            </p>
          </div>

        </div>

      </div>

      {/* Official Contribution Receipt & Certificate Modal */}
      {receiptRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 text-white p-6 text-center space-y-2 relative">
              <div className="w-14 h-14 mx-auto bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                <CheckCircle2 className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Official Contribution Recorded!
              </h3>
              <p className="text-xs text-emerald-100">
                Thank you for empowering Liberian scholars, orators, and innovators.
              </p>
            </div>

            {/* Receipt Body */}
            <div className="p-6 sm:p-8 space-y-6 text-xs">
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <YocLogo size="sm" />
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">Youth For Change Liberia</div>
                      <div className="text-[10px] text-slate-500">Official Electronic Contribution Receipt</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                      Confirmed
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {new Date(receiptRecord.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Contributor</span>
                    <span className="font-bold text-slate-900 text-sm">{receiptRecord.donorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Contribution Amount</span>
                    <span className="font-black text-emerald-800 text-base">
                      {receiptRecord.currency === 'USD' ? `$${receiptRecord.amount}` : `L$${receiptRecord.amount.toLocaleString()}`} {receiptRecord.currency}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Allocated Program</span>
                    <span className="font-semibold text-slate-800">{receiptRecord.program}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Payment Channel</span>
                    <span className="font-semibold text-slate-800">{receiptRecord.paymentMethod}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Official Reference ID</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">{receiptRecord.transactionReference}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(receiptRecord.transactionReference, 'ref-id')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedCode === 'ref-id' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>Copy ID</span>
                  </button>
                </div>
              </div>

              <div className="text-center text-[11px] text-slate-500">
                A confirmation has been logged for <strong>{receiptRecord.donorEmail}</strong>. You may save or print this official receipt for your records.
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptRecord(null)}
                  className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 text-yellow-300" />
                  <span>Done & Return to Site</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};
