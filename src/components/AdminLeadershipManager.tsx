import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  MapPin, 
  Mail, 
  Phone, 
  Share2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  X, 
  Save, 
  Building2, 
  Eye, 
  MoveUp, 
  MoveDown,
  UserCheck,
  Briefcase
} from 'lucide-react';
import { LeaderMember } from '../types';
import { useLeadership } from '../hooks/useLeadership';
import { 
  createLeader, 
  updateLeader, 
  deleteLeader,
  seedLeadershipRoles
} from '../lib/leadershipService';
import { LEADERSHIP_ROLES, LEADERSHIP_TEAM } from '../data/contentData';
import { ImageUploadField } from './ImageUploadField';
import { SafeImage } from './SafeImage';
import { useToast } from '../context/ToastContext';

interface AdminLeadershipManagerProps {
  userEmail?: string | null;
}

const LIBERIA_COUNTIES = [
  'National / All Counties',
  'Montserrado',
  'Margibi',
  'Nimba',
  'Bong',
  'Grand Bassa',
  'Lofa',
  'Maryland',
  'Sinoe',
  'Grand Cape Mount',
  'Bomi',
  'Grand Gedeh',
  'River Gee',
  'Rivercess',
  'Grand Kru',
  'Gbarpolu'
];

const DEPARTMENTS = [
  'Executive Directorate',
  'Programs & Operations',
  'Finance & Administration',
  'Media, Press & Communications',
  'Human Resources & Talent',
  'Logistics & Procurement',
  'Training & Capacity Building',
  'Debate & Forensics Directorate',
  'STEM & Innovation Directorate',
  'County Operations & Logistics',
  'Youth Mentorship & Scholarships',
  'Advisory Board & Trustees',
  'County Coordination'
];

const ROLE_TO_DEPARTMENT: Record<string, string> = {
  'Founder & Executive Director': 'Executive Directorate',
  'Program Manager': 'Programs & Operations',
  'Program Associate': 'Programs & Operations',
  'Finance Manager': 'Finance & Administration',
  'Accountant': 'Finance & Administration',
  'Communication Lead': 'Media, Press & Communications',
  'Media Associate': 'Media, Press & Communications',
  'HR': 'Human Resources & Talent',
  'Procurement Manager': 'Logistics & Procurement',
  'Training and Development officer': 'Training & Capacity Building'
};

const PRESET_LEADER_IMAGES = [
  {
    label: 'Professional Executive Portrait 1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Professional Executive Portrait 2',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Professional Executive Portrait 3',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Professional Executive Portrait 4',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'YFC Organization Official Emblem',
    url: '/yoc.jpg'
  },
  {
    label: 'YFC Group Delegation Banner',
    url: '/group.jpg'
  }
];

export const AdminLeadershipManager: React.FC<AdminLeadershipManagerProps> = ({ userEmail }) => {
  const toast = useToast();
  const { leaders, loading } = useLeadership();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [countyFilter, setCountyFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [seeding, setSeeding] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingLeader, setDeletingLeader] = useState<LeaderMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    role: string;
    department: string;
    county: string;
    bio: string;
    image: string;
    social: string;
    email: string;
    phone: string;
    order: number;
    active: boolean;
  }>({
    name: '',
    role: '',
    department: 'Executive Directorate',
    county: 'Montserrado',
    bio: '',
    image: '',
    social: '',
    email: '',
    phone: '',
    order: 1,
    active: true
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: '',
      role: '',
      department: 'Executive Directorate',
      county: 'Montserrado',
      bio: '',
      image: '',
      social: '',
      email: '',
      phone: '',
      order: leaders.length + 1,
      active: true
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (leader: LeaderMember) => {
    setIsEditing(true);
    setEditingId(leader.id || null);
    setFormData({
      name: leader.name || '',
      role: leader.role || '',
      department: leader.department || 'Executive Directorate',
      county: leader.county || 'Montserrado',
      bio: leader.bio || '',
      image: leader.image || '',
      social: leader.social || '',
      email: leader.email || '',
      phone: leader.phone || '',
      order: typeof leader.order === 'number' ? leader.order : leaders.length + 1,
      active: leader.active ?? true
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) errors.name = 'Full Name is required';
    if (!formData.role.trim()) errors.role = 'Role / Title is required';
    if (!formData.bio.trim()) errors.bio = 'Bio / Background profile is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please complete all required fields', 'Validation Error');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && editingId) {
        await updateLeader(editingId, {
          name: formData.name.trim(),
          role: formData.role.trim(),
          department: formData.department,
          county: formData.county,
          bio: formData.bio.trim(),
          image: formData.image.trim(),
          social: formData.social.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          order: Number(formData.order) || 1,
          active: formData.active
        });
        toast.success(`Profile for "${formData.name}" updated successfully!`, 'Leader Updated');
      } else {
        await createLeader({
          name: formData.name.trim(),
          role: formData.role.trim(),
          department: formData.department,
          county: formData.county,
          bio: formData.bio.trim(),
          image: formData.image.trim(),
          social: formData.social.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          order: Number(formData.order) || leaders.length + 1,
          active: formData.active
        }, userEmail || undefined);
        toast.success(`New leader "${formData.name}" added to the official team!`, 'Leader Added');
      }
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving leader:', err);
      toast.error(err.message || 'Failed to save leader profile', 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingLeader?.id) return;
    setDeleting(true);
    try {
      await deleteLeader(deletingLeader.id);
      toast.success(`Removed "${deletingLeader.name}" from the leadership directory.`, 'Leader Removed');
      setShowDeleteModal(false);
      setDeletingLeader(null);
    } catch (err: any) {
      console.error('Error deleting leader:', err);
      toast.error('Failed to remove leader profile', 'Error');
    } finally {
      setDeleting(false);
    }
  };

  const handleSeedOfficialRoles = async () => {
    setSeeding(true);
    try {
      await seedLeadershipRoles(userEmail || undefined);
      toast.success('All 10 official leadership roles synchronized to the directory!', 'Roles Synced');
    } catch (err: any) {
      console.error('Error syncing roles:', err);
      toast.error('Failed to sync leadership roles', 'Error');
    } finally {
      setSeeding(false);
    }
  };

  // Filter leaders
  const filteredLeaders = leaders.filter(leader => {
    const matchesSearch = 
      (leader.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (leader.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (leader.bio || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (leader.county || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (leader.department || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = departmentFilter === 'All' || leader.department === departmentFilter;
    const matchesCounty = countyFilter === 'All' || leader.county?.includes(countyFilter);
    const matchesRole = roleFilter === 'All' || leader.role === roleFilter;

    return matchesSearch && matchesDept && matchesCounty && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-xs font-black uppercase tracking-wider text-emerald-200">
            <UserCheck className="w-3.5 h-3.5 text-yellow-400" />
            <span>Executive Directorate & 10 Official Roles</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Leadership Team Management</h2>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Manage the 10 official leadership roles: Founder & Executive Director, Program Manager, Program Associate, Finance Manager, Accountant, Communication Lead, Media Associate, HR, Procurement Manager, and Training and Development officer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSeedOfficialRoles}
            disabled={seeding}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/50 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            title="Populate or restore the 10 official leadership directory roles"
          >
            <Sparkles className={`w-4 h-4 text-yellow-300 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Syncing...' : 'Sync 10 Official Roles'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black text-xs sm:text-sm shadow-lg flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Leader</span>
          </button>
        </div>
      </div>

      {/* 10 Official Leadership Roles Quick Navigator */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-emerald-700" /> Official Roles Directory Status ({LEADERSHIP_ROLES.length} Roles)
          </span>
          <span className="text-slate-400 font-medium">Click role to filter list</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setRoleFilter('All')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              roleFilter === 'All' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Roles ({leaders.length})
          </button>
          {LEADERSHIP_ROLES.map(role => {
            const isAssigned = leaders.some(l => (l.role || '').toLowerCase().trim() === role.toLowerCase().trim());
            const isSelected = roleFilter === role;
            return (
              <button
                type="button"
                key={role}
                onClick={() => setRoleFilter(role === roleFilter ? 'All' : role)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-xs ring-2 ring-emerald-600'
                    : isAssigned
                      ? 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200/80'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/80'
                }`}
              >
                {isAssigned ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                )}
                <span>{role}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, role, county, or biography..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent font-semibold focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="All">All Roles</option>
              {LEADERSHIP_ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">Dept:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">County:</span>
            <select
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              className="bg-transparent font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Counties</option>
              {LIBERIA_COUNTIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="text-xs font-bold text-slate-500 px-2">
            Total: <span className="text-emerald-700 font-black">{filteredLeaders.length}</span>
          </div>
        </div>
      </div>

      {/* Leaders List / Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-600">Loading leadership team registry...</p>
        </div>
      ) : filteredLeaders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-100">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {leaders.length === 0 ? 'No Leadership Profiles Added Yet' : 'No Leaders Match Your Filter'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {leaders.length === 0 
                ? 'The default mock leadership team has been removed. You can now add the real executive directors, coordinators, and board members.'
                : 'Try adjusting your search keywords or filter dropdowns to view results.'}
            </p>
          </div>
          {leaders.length === 0 && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Executive Leader</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeaders.map((leader, index) => (
            <div 
              key={leader.id || index}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-emerald-600 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Photo & Header */}
                <div className="relative h-60 bg-slate-900 overflow-hidden">
                  <SafeImage
                    src={leader.image}
                    alt={leader.name}
                    fallbackCategory="leadership"
                    fallbackTitle={leader.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Order Badge */}
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs text-white text-[11px] font-black px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                    <span className="text-yellow-400 font-mono">#{leader.order ?? (index + 1)}</span>
                    <span className="text-slate-300 font-sans text-[10px]">{leader.department || 'Directorate'}</span>
                  </div>

                  {/* County Badge */}
                  <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-400" />
                    <span>{leader.county}</span>
                  </div>

                  {/* Active status */}
                  {leader.active === false && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                      Hidden / Draft
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-2.5">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {leader.name}
                    </h3>
                    <div className="text-xs font-black text-emerald-800 uppercase tracking-wider pt-0.5">
                      {leader.role}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {leader.bio}
                  </p>

                  {/* Contact / Social snippets */}
                  {(leader.social || leader.email || leader.phone) && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      {leader.social && (
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                          <Share2 className="w-3 h-3" /> {leader.social}
                        </span>
                      )}
                      {leader.email && (
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Mail className="w-3 h-3" /> {leader.email}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Live on About Page
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(leader)}
                    title="Edit Leader Profile"
                    className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeletingLeader(leader);
                      setShowDeleteModal(true);
                    }}
                    title="Delete Leader Profile"
                    className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT LEADER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {isEditing ? 'Edit Leadership Profile' : 'Add New Executive Leader'}
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Enter official details for the YFC leadership directory
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Full Name *</span>
                    <span className="text-[11px] text-slate-400 font-normal">e.g. Amb. Emmanuel J. Flomo</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter leader's full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-medium focus:outline-none focus:ring-2 ${
                      formErrors.name 
                        ? 'border-rose-400 focus:ring-rose-200' 
                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-600'
                    }`}
                  />
                  {formErrors.name && <p className="text-[11px] text-rose-600 font-bold">{formErrors.name}</p>}
                </div>

                {/* Role / Title */}
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Official Role / Title *</label>
                    <span className="text-[11px] text-slate-500 font-medium">Click to pick one of the 10 official roles</span>
                  </div>

                  {/* 10 Official Roles Quick Selector Chips */}
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {LEADERSHIP_ROLES.map(role => {
                      const isSelected = formData.role.toLowerCase().trim() === role.toLowerCase().trim();
                      return (
                        <button
                          type="button"
                          key={role}
                          onClick={() => {
                            const dept = ROLE_TO_DEPARTMENT[role] || formData.department;
                            setFormData(prev => ({
                              ...prev,
                              role,
                              department: dept
                            }));
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-800 text-white shadow-xs scale-102'
                              : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="text"
                    required
                    list="official-leadership-roles-datalist"
                    placeholder="Select from above or type role (e.g. Founder & Executive Director)..."
                    value={formData.role}
                    onChange={(e) => {
                      const val = e.target.value;
                      const dept = ROLE_TO_DEPARTMENT[val] || formData.department;
                      setFormData({ ...formData, role: val, department: dept });
                    }}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-medium focus:outline-none focus:ring-2 ${
                      formErrors.role 
                        ? 'border-rose-400 focus:ring-rose-200' 
                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-600'
                    }`}
                  />
                  <datalist id="official-leadership-roles-datalist">
                    {LEADERSHIP_ROLES.map(r => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                  {formErrors.role && <p className="text-[11px] text-rose-600 font-bold">{formErrors.role}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Department */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Department / Division</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* County */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>County / Regional Representation</span>
                  </label>
                  <select
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                  >
                    {LIBERIA_COUNTIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Biography */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Biography & Experience Profile *</span>
                  <span className="text-[11px] text-slate-400 font-normal">Background, expertise, leadership scope</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter detailed background, academic qualifications, civic career, and leadership contributions..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-medium focus:outline-none focus:ring-2 leading-relaxed ${
                    formErrors.bio 
                      ? 'border-rose-400 focus:ring-rose-200' 
                      : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-600'
                  }`}
                />
                {formErrors.bio && <p className="text-[11px] text-rose-600 font-bold">{formErrors.bio}</p>}
              </div>

              {/* Profile Photo / Upload */}
              <div className="space-y-1.5">
                <ImageUploadField
                  label="Leader Portrait / Profile Picture"
                  helperText="Upload official headshot from computer, drag & drop, or enter a photo URL. Portrait format recommended."
                  value={formData.image}
                  onChange={(imgUrl) => setFormData({ ...formData, image: imgUrl })}
                  aspectRatio="portrait"
                  presets={PRESET_LEADER_IMAGES}
                />
              </div>

              {/* Contact & Social Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Share2 className="w-3 h-3 text-emerald-700" />
                    <span>Social Handle</span>
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={formData.social}
                    onChange={(e) => setFormData({ ...formData, social: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-emerald-700" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    placeholder="leader@youthforchangeliberia.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-700" />
                    <span>Phone / WhatsApp</span>
                  </label>
                  <input
                    type="text"
                    placeholder="+231 770 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Priority Order & Active Visibility */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700">Display Priority Order:</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="w-20 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-emerald-900 focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[11px] text-slate-400">(Lower numbers appear first)</span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-emerald-700 rounded-md focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Publish & Show on Public About Page</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Publish Leader Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && deletingLeader && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Remove Leadership Profile?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to remove <strong className="text-slate-900">{deletingLeader.name}</strong> ({deletingLeader.role}) from the official leadership team directory?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingLeader(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
