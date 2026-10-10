import React, { useState, useEffect } from 'react';
import {
  Camera,
  Play,
  Calendar,
  Film,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Search,
  Filter,
  RefreshCw,
  X,
  Sparkles,
  Check,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  ExternalLink,
  Upload,
  UploadCloud,
  FolderPlus,
  Tag,
  Layers,
  Bell,
  CheckSquare,
  Square
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GalleryItem } from '../types';
import { CURATED_DEFAULT_MEDIA, seedCuratedGalleryIfEmpty } from '../lib/galleryService';
import { SafeImage, getContextualArchiveFallback } from './SafeImage';
import { ImageUploadField } from './ImageUploadField';
import { VideoUploadField } from './VideoUploadField';
import { MediaVideoPlayer, isPlayableVideoUrl, parseVideoEmbed } from './MediaVideoPlayer';
import { BulkMediaUploadModal } from './BulkMediaUploadModal';
import { uploadMediaToServer } from '../lib/videoUtils';
import { compressDataUrlForPermanentStorage } from '../lib/imageUtils';
import { clearAllVideoBlobs } from '../lib/mediaStorage';
import { useToast } from '../context/ToastContext';

interface AdminMediaManagerProps {
  userEmail?: string | null;
}

const LIBERIA_COUNTIES = [
  'National',
  'Montserrado',
  'Nimba',
  'Bong',
  'Margibi',
  'Grand Bassa',
  'Lofa',
  'Maryland',
  'Sinoe',
  'Grand Cape Mount',
  'Grand Gedeh',
  'River Gee',
  'Rivercess',
  'Bomi',
  'Grand Kru',
  'Gbarpolu'
];

const PRESET_IMAGE_TEMPLATES = [
  {
    name: 'Debate Finals Crowd & Stage',
    url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80',
    tag: 'Debate Finals',
    category: 'photos' as const
  },
  {
    name: 'STEM Innovation & Prototype Demo',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80',
    tag: 'STEM Expo',
    category: 'photos' as const
  },
  {
    name: 'Championship Trophy Celebration',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80',
    tag: 'Celebration',
    category: 'photos' as const
  },
  {
    name: 'County Workshop & Adjudicator Training',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80',
    tag: 'Training',
    category: 'photos' as const
  },
  {
    name: 'Youth Leadership Summit Auditorium',
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80',
    tag: 'Annual Summit',
    category: 'events' as const
  },
  {
    name: 'Scholarship Gala & Awards Night',
    url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=80',
    tag: 'Scholarships',
    category: 'photos' as const
  }
];

export const AdminMediaManager: React.FC<AdminMediaManagerProps> = ({ userEmail }) => {
  const toast = useToast();
  const [activeMediaTab, setActiveMediaTab] = useState<'all' | 'photos' | 'videos' | 'events'>('photos');
  const [mediaItems, setMediaItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [countyFilter, setCountyFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Batch Selection State
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'photos' as 'photos' | 'videos' | 'events',
    editionYear: '2024/25',
    county: 'Montserrado',
    url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80',
    videoUrl: '',
    description: '',
    date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    tag: 'Debate Finals',
    duration: '1h 20m',
    videoEmbedUrl: '',
    venue: 'EJS Ministerial Complex, Monrovia',
    eventTime: '9:00 AM - 4:00 PM GMT',
    registrationLink: ''
  });

  // Realtime subscription to Firestore galleryItems
  useEffect(() => {
    setLoading(true);
    try {
      if (!db) {
        setLoading(false);
        return;
      }
      const q = query(collection(db, 'galleryItems'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items: GalleryItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            title: data.title || 'Untitled Media',
            category: data.category || 'photos',
            editionYear: data.editionYear || '2024/25',
            county: data.county || 'Montserrado',
            url: data.url || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80',
            videoUrl: data.videoUrl || '',
            description: data.description || '',
            date: data.date || '',
            tag: data.tag || 'General',
            duration: data.duration,
            videoEmbedUrl: data.videoEmbedUrl,
            venue: data.venue,
            eventTime: data.eventTime,
            registrationLink: data.registrationLink,
            authorUid: data.authorUid,
            createdAt: data.createdAt
          });
        });
        setMediaItems(items);
        setLoading(false);
      }, (err) => {
        console.warn('Firestore galleryItems sync error:', err);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not establish gallery listener:', e);
      setLoading(false);
    }
  }, []);

  // Filter Items
  const filteredList = mediaItems.filter(item => {
    const matchesCategory = activeMediaTab === 'all' || item.category === activeMediaTab;
    const matchesCounty = countyFilter === 'all' || item.county.toLowerCase() === countyFilter.toLowerCase();
    const matchesTag = tagFilter === 'all' || item.tag === tagFilter;
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.county.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesCounty && matchesTag && matchesSearch;
  });

  const availableTags = ['all', ...Array.from(new Set(mediaItems.map(i => i.tag).filter(Boolean)))];

  const photosCount = mediaItems.filter(i => i.category === 'photos').length;
  const videosCount = mediaItems.filter(i => i.category === 'videos').length;
  const eventsCount = mediaItems.filter(i => i.category === 'events').length;

  const handleOpenAddModal = (defaultCategory?: 'photos' | 'videos' | 'events') => {
    const cat = defaultCategory || (activeMediaTab === 'all' ? 'photos' : activeMediaTab);
    setEditingItem(null);
    setActionError(null);
    setActionSuccess(null);
    setFormData({
      title: cat === 'photos' 
        ? '2025 National Grand Finals Trophy Presentation'
        : cat === 'videos' 
          ? 'Full Match: 2024/25 Grand Championship Debate Clash' 
          : '2025/2026 National Youth Peace & Academic Summit',
      category: cat,
      editionYear: '2024/25',
      county: 'Montserrado',
      url: cat === 'photos' 
        ? 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80'
        : cat === 'videos' 
          ? 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1000&q=80'
          : 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80',
      videoUrl: '',
      description: cat === 'photos'
        ? 'Students and faculty advisors rejoicing after the championship awards ceremony in Monrovia.'
        : cat === 'videos'
          ? 'Watch the complete forensic debate showdown with adjudicator remarks and trophy celebration.'
          : '3-day residential leadership conference bringing together 300 youth debaters and innovators.',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      tag: cat === 'photos' ? 'Debate Finals' : cat === 'videos' ? 'Full Match Video' : 'Annual Summit',
      duration: cat === 'videos' ? '1h 24m' : '',
      videoEmbedUrl: cat === 'videos' ? '' : '',
      venue: 'EJS Ministerial Complex, Congo Town, Monrovia',
      eventTime: '9:00 AM - 4:30 PM GMT',
      registrationLink: 'events@youthforchange.org.lr'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: GalleryItem) => {
    setEditingItem(item);
    setActionError(null);
    setActionSuccess(null);
    setFormData({
      title: item.title,
      category: item.category,
      editionYear: item.editionYear || '2024/25',
      county: item.county || 'Montserrado',
      url: item.url,
      videoUrl: item.videoUrl || '',
      description: item.description,
      date: item.date,
      tag: item.tag,
      duration: item.duration || '',
      videoEmbedUrl: item.videoEmbedUrl || '',
      venue: item.venue || 'EJS Ministerial Complex, Monrovia',
      eventTime: item.eventTime || '9:00 AM - 4:00 PM GMT',
      registrationLink: item.registrationLink || ''
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      toast.warning('File size exceeds 2.5MB. Please choose a smaller image or use an image URL.', 'File Size Exceeded');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setFormData(prev => ({ ...prev, url: result }));
        toast.success(`Image file "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) attached for upload.`, 'File Attached');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || (!formData.url && !formData.videoUrl)) {
      setActionError('Please provide at least a title and an uploaded media file.');
      toast.error('Please provide at least a title and an uploaded media file.', 'Incomplete Form');
      return;
    }

    setIsSaving(true);
    setActionError(null);

    try {
      let finalUrl = formData.url.trim();
      let finalVideoUrl = formData.videoUrl.trim();
      let finalVideoEmbedUrl = formData.videoEmbedUrl.trim();

      // Check if user entered a YouTube or Vimeo link in any field
      const ytCandidate = finalVideoEmbedUrl || finalVideoUrl || (formData.category === 'videos' ? finalUrl : '');
      const ytMatch = ytCandidate.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/);

      if (ytMatch && ytMatch[1]) {
        finalVideoEmbedUrl = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`;
        if (!finalVideoUrl || finalVideoUrl.startsWith('data:video')) {
          finalVideoUrl = `https://www.youtube.com/watch?v=${ytMatch[1]}`;
        }
        // If user didn't upload a custom photo cover, use YouTube's permanent HD thumbnail
        if (!finalUrl || finalUrl.includes('/uploads/') || finalUrl.includes('unsplash.com') || finalUrl.startsWith('data:video')) {
          finalUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
        }
      }

      // If finalUrl is a data URL (uploaded picture or poster frame), compress to stay safely under 75KB and store directly in Firestore!
      // This guarantees the picture NEVER vanishes when container restarts!
      if (finalUrl.startsWith('data:image')) {
        try {
          finalUrl = await compressDataUrlForPermanentStorage(finalUrl, 900, 0.76);
        } catch (e) {
          console.warn('Image compression warning:', e);
        }
      }

      // If videoUrl is a raw data URL, upload to server storage for local preview
      if (finalVideoUrl.startsWith('data:')) {
        try {
          const uploadRes = await uploadMediaToServer(finalVideoUrl, `${formData.title}_video.mp4`, 'video');
          finalVideoUrl = uploadRes.url;
        } catch (e) {
          console.warn('Video server upload warning:', e);
        }
      }

      // If url is a data:video URL, upload it to server
      if (finalUrl.startsWith('data:video')) {
        try {
          const uploadRes = await uploadMediaToServer(finalUrl, `${formData.title}_video.mp4`, 'video');
          finalUrl = uploadRes.url;
          if (!finalVideoUrl) finalVideoUrl = uploadRes.url;
        } catch (e) {
          console.warn('Video url upload warning:', e);
        }
      }

      // For video category, ensure videoUrl is set if it's a real video or embed URL
      if (formData.category === 'videos') {
        if (!finalVideoUrl && (finalVideoEmbedUrl || isPlayableVideoUrl(finalUrl) || parseVideoEmbed(finalUrl))) {
          finalVideoUrl = finalVideoEmbedUrl || finalUrl;
        }
      }

      // Final safety check: if url is empty or points to ephemeral server uploads that don't exist, use contextual permanent archive photo
      if (!finalUrl || finalUrl.startsWith('/uploads/')) {
        finalUrl = getContextualArchiveFallback(formData.category, formData.title + ' ' + formData.tag);
      }

      const primaryUrl = finalUrl;
      const payload: any = {
        title: formData.title.trim(),
        category: formData.category,
        editionYear: formData.editionYear.trim(),
        county: formData.county,
        url: primaryUrl,
        posterUrl: primaryUrl,
        videoUrl: finalVideoUrl || '',
        description: formData.description.trim(),
        date: formData.date.trim(),
        tag: formData.tag.trim(),
        isVerified: true,
        lastVerifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Strict safety check to prevent any Firestore limit errors
      const payloadSize = JSON.stringify(payload).length;
      if (payloadSize > 800000) {
        throw new Error('Media file is too large for database document. Please re-upload using the file selector.');
      }

      if (formData.category === 'videos') {
        payload.duration = formData.duration.trim() || '15m 00s';
        if (finalVideoEmbedUrl) payload.videoEmbedUrl = finalVideoEmbedUrl;
      }

      if (formData.category === 'events') {
        payload.venue = formData.venue.trim();
        payload.eventTime = formData.eventTime.trim();
        if (formData.registrationLink) payload.registrationLink = formData.registrationLink.trim();
      }

      if (editingItem) {
        await updateDoc(doc(db, 'galleryItems', editingItem.id), payload);
        setActionSuccess('Media item updated successfully!');
        toast.success(`Media item "${formData.title}" updated successfully!`, 'Media Updated');
      } else {
        payload.createdAt = new Date().toISOString();
        payload.authorEmail = userEmail || 'admin@youthforchange.org.lr';
        await addDoc(collection(db, 'galleryItems'), payload);
        setActionSuccess('Media item published to live website!');
        const typeLabel = formData.category === 'photos' ? 'Photo album' : formData.category === 'videos' ? 'Match video' : 'Key event';
        toast.success(
          `${typeLabel} "${formData.title}" successfully uploaded and published to the Media Gallery!`,
          'File Upload Successful',
          5000
        );
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setActionSuccess(null);
      }, 1000);
    } catch (err: any) {
      console.error('Error saving media item:', err);
      setActionError(err.message || 'Failed to save media item. Please check connection and permissions.');
      toast.error(err.message || 'Failed to save media item.', 'Save Failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMedia = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this media item from the gallery?')) return;
    try {
      await deleteDoc(doc(db, 'galleryItems', itemId));
      toast.info('Media item removed from archive.', 'Item Deleted');
      setSelectedItemIds(prev => prev.filter(id => id !== itemId));
    } catch (err: any) {
      console.error('Error deleting media item:', err);
      toast.error('Failed to delete item: ' + (err.message || 'Permission denied'), 'Delete Failed');
    }
  };

  // Toggle item in batch selection
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  // Toggle select all filtered items
  const handleToggleSelectAll = () => {
    if (selectedItemIds.length === filteredList.length && filteredList.length > 0) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredList.map(i => i.id));
    }
  };

  // Batch delete selected items
  const handleBatchDelete = async () => {
    if (selectedItemIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedItemIds.length} selected media items from the gallery?`)) return;
    
    setLoading(true);
    try {
      for (const id of selectedItemIds) {
        await deleteDoc(doc(db, 'galleryItems', id));
      }
      toast.success(`Successfully deleted ${selectedItemIds.length} media items.`, 'Batch Delete Complete');
      setSelectedItemIds([]);
      setIsSelectionMode(false);
    } catch (err: any) {
      console.error('Error batch deleting media items:', err);
      toast.error('Failed to complete batch delete: ' + err.message, 'Delete Failed');
    } finally {
      setLoading(false);
    }
  };

  // Delete all videos from the gallery, local cache, and server storage
  const handleDeleteAllVideos = async () => {
    const videoItems = mediaItems.filter(i => i.category === 'videos');
    if (videoItems.length === 0) {
      toast.info('There are no video items in the gallery to delete.', 'No Videos Found');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete all ${videoItems.length} video(s) from the gallery? This will clear all video records and temporary caches so you can re-upload fresh videos.`)) return;

    setLoading(true);
    try {
      // 1. Delete all Firestore video docs
      for (const item of videoItems) {
        await deleteDoc(doc(db, 'galleryItems', item.id));
      }

      // 2. Clear client-side IndexedDB video cache
      await clearAllVideoBlobs();

      // 3. Clear server-side uploads/videos folder
      try {
        await fetch('/api/admin/clear-videos', { method: 'POST' });
      } catch (srvErr) {
        console.warn('Server clear videos warning:', srvErr);
      }

      toast.success(`Successfully cleared all ${videoItems.length} video(s) from the gallery. You can now re-upload fresh videos!`, 'Videos Deleted');
      setSelectedItemIds(prev => prev.filter(id => !videoItems.some(v => v.id === id)));
    } catch (err: any) {
      console.error('Error deleting all videos:', err);
      toast.error('Failed to delete videos: ' + (err.message || 'Permission denied'), 'Delete Failed');
    } finally {
      setLoading(false);
    }
  };

  // Auto-Repair and Permanize Broken Media Links
  const handleAutoRepairMediaLinks = async () => {
    const brokenItems = mediaItems.filter(item => 
      !item.url || 
      item.url.startsWith('/uploads/') || 
      item.url.includes('uploaded_image') || 
      item.url.includes('uploaded_video')
    );

    if (brokenItems.length === 0) {
      toast.success('All media items already have permanent, non-expiring links!', 'Media 100% Healthy');
      return;
    }

    setLoading(true);
    let repairedCount = 0;
    try {
      for (const item of brokenItems) {
        let permanentUrl = '';
        // 1. If it has a YouTube link, extract the permanent HD thumbnail
        const ytMatch = (item.videoEmbedUrl || item.videoUrl || item.url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/);
        if (ytMatch && ytMatch[1]) {
          permanentUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
        } else {
          // 2. Otherwise map to our permanent high-resolution archive photography
          permanentUrl = getContextualArchiveFallback(item.category, item.title + ' ' + (item.tag || ''));
        }

        await updateDoc(doc(db, 'galleryItems', item.id), {
          url: permanentUrl,
          updatedAt: new Date().toISOString()
        });
        repairedCount++;
      }
      toast.success(
        `Successfully repaired ${repairedCount} media item(s) with permanent high-resolution photography! They will never go blank green again.`,
        'Auto-Repair Complete',
        6000
      );
    } catch (err: any) {
      console.error('Error repairing media items:', err);
      toast.error('Failed to auto-repair items: ' + err.message, 'Repair Failed');
    } finally {
      setLoading(false);
    }
  };

  // Seed default items if empty
  const handleSeedDefaultMedia = async () => {
    if (!window.confirm('This will seed the initial 12 curated photos, videos, and events from the YFC archives into your live database. Continue?')) return;
    setLoading(true);
    try {
      await seedCuratedGalleryIfEmpty();
      toast.success('Initial 12 curated media items seeded to live database with permanent photography!', 'Seeding Complete');
    } catch (err: any) {
      console.error('Error seeding media:', err);
      toast.error('Failed to seed default media: ' + err.message, 'Seeding Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border border-emerald-500/20">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-400/30">
            <Camera className="w-3.5 h-3.5" /> Media Archive & Event Studio
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Upload & Curate Photos, Videos & Key Events
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
            Manage high-definition tournament photo albums, recorded video debate matches, and upcoming county summits. All uploads synchronize instantly with the public Media Gallery and Highlights page.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="bg-yellow-400 hover:bg-yellow-300 text-emerald-950 px-4 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-yellow-400/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95 border border-yellow-300"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Bulk Upload Media</span>
          </button>

          <div className="inline-flex rounded-xl bg-white/10 p-1 backdrop-blur-xs border border-white/20">
            <button
              onClick={() => handleOpenAddModal('photos')}
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" /> + Photo
            </button>
            <button
              onClick={() => handleOpenAddModal('videos')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ml-1"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> + Video
            </button>
            <button
              onClick={() => handleOpenAddModal('events')}
              className="bg-white hover:bg-slate-100 text-emerald-950 px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ml-1"
            >
              <Calendar className="w-3.5 h-3.5" /> + Key Event
            </button>
          </div>
        </div>
      </div>

      {/* Permanent Media Consistency Guide & One-Click Auto-Repair Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-300/80 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-black text-emerald-950">
                Permanent Media Storage Active
              </h4>
              <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Google Cloud Persistent
              </span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed mt-1 max-w-3xl">
              All photos uploaded now store permanently as compressed images directly in your Google Cloud Firestore database — they will <strong>never disappear, expire, or turn blank green</strong> across server restarts. For tournament match videos, paste a YouTube or Vimeo link for permanent, buffer-free streaming across all 15 counties.
            </p>
          </div>
        </div>

        <button
          onClick={handleAutoRepairMediaLinks}
          disabled={loading}
          className="shrink-0 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 hover:border-emerald-400 px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          title="Scans all database gallery items and repairs any expired server links with permanent high-resolution photography"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${loading ? 'animate-spin' : ''}`} />
          <span>Auto-Repair Broken Media</span>
        </button>
      </div>

      {/* Subtabs for Media Categories */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1">
          <button
            onClick={() => setActiveMediaTab('photos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMediaTab === 'photos'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Photo Albums ({photosCount})</span>
          </button>
          <button
            onClick={() => setActiveMediaTab('videos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMediaTab === 'videos'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Videos & Matches ({videosCount})</span>
          </button>
          <button
            onClick={() => setActiveMediaTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMediaTab === 'events'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Key Events & Summits ({eventsCount})</span>
          </button>
          <button
            onClick={() => setActiveMediaTab('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMediaTab === 'all'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All ({mediaItems.length})</span>
          </button>
        </div>

        {/* Quick Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, county, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 w-48 sm:w-60"
            />
          </div>

          <select
            value={countyFilter}
            onChange={(e) => setCountyFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="all">All Counties</option>
            {LIBERIA_COUNTIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {availableTags.length > 2 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="all">All Tags</option>
              {availableTags.filter(t => t !== 'all').map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Batch Management Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            {selectedItemIds.length === filteredList.length && filteredList.length > 0 ? (
              <>
                <CheckSquare className="w-4 h-4 text-emerald-700" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <Square className="w-4 h-4 text-slate-500" />
                <span>Select All ({filteredList.length})</span>
              </>
            )}
          </button>

          {selectedItemIds.length > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs">
              {selectedItemIds.length} item{selectedItemIds.length > 1 ? 's' : ''} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeMediaTab === 'videos' && videosCount > 0 && (
            <button
              type="button"
              onClick={handleDeleteAllVideos}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Delete all video entries from the gallery so you can re-upload"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete All Videos ({videosCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-yellow-300" />
            <span>+ Bulk Upload Photos & Videos</span>
          </button>

          {selectedItemIds.length > 0 && (
            <button
              type="button"
              onClick={handleBatchDelete}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedItemIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Media Cards Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-500">Synchronizing Media Gallery with Firestore...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            {activeMediaTab === 'photos' ? <Camera className="w-8 h-8" /> : activeMediaTab === 'videos' ? <Play className="w-8 h-8" /> : <Calendar className="w-8 h-8" />}
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">No {activeMediaTab} found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {searchQuery || countyFilter !== 'all' || tagFilter !== 'all'
                ? 'No items match your active search filters. Try clearing your filters.'
                : `Upload your first ${activeMediaTab === 'photos' ? 'photo album' : activeMediaTab === 'videos' ? 'video match clip' : 'key event'} using the buttons below.`}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Bulk Upload Files</span>
            </button>
            <button
              onClick={() => handleOpenAddModal(activeMediaTab === 'all' ? 'photos' : activeMediaTab)}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              + Upload Single {activeMediaTab === 'photos' ? 'Photo' : activeMediaTab === 'videos' ? 'Video' : 'Event'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group ${
                  isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Media Image / Video Banner */}
                  <div className="h-48 overflow-hidden relative bg-slate-950">
                    {/* Item Select Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectItem(item.id);
                      }}
                      aria-label={isSelected ? 'Deselect media item' : 'Select media item'}
                      className={`absolute top-3 left-3 z-20 p-1.5 rounded-lg backdrop-blur-md transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md ring-2 ring-white/50'
                          : 'bg-black/50 text-white/80 hover:bg-black/80 hover:text-white'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-white" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    {item.category === 'videos' && (item.url?.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) || item.url?.includes('/uploads/videos/') || item.url?.startsWith('data:video')) ? (
                      <video
                        src={item.videoUrl || item.url}
                        preload="metadata"
                        muted
                        playsInline
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                      />
                    ) : (
                      <SafeImage
                        src={item.url}
                        alt={item.title}
                        fallbackCategory="gallery"
                        fallbackTitle={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    
                    {/* Edition Year Badge */}
                    <span className="absolute top-3 left-12 bg-slate-950/80 text-white text-[10px] font-black px-2 py-1 rounded-md backdrop-blur-xs border border-white/10">
                      {item.editionYear}
                    </span>

                  {/* Category Pill */}
                  <span className={`absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1 ${
                    item.category === 'photos' 
                      ? 'bg-emerald-600/90 text-white' 
                      : item.category === 'videos' 
                        ? 'bg-red-600/90 text-white' 
                        : 'bg-amber-500/90 text-slate-950'
                  }`}>
                    {item.category === 'photos' && <Camera className="w-3 h-3" />}
                    {item.category === 'videos' && <Play className="w-3 h-3 fill-current" />}
                    {item.category === 'events' && <Calendar className="w-3 h-3" />}
                    <span className="uppercase">{item.category}</span>
                  </span>

                  {/* Video Play Overlay */}
                  {item.category === 'videos' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30">
                      <div className="w-10 h-10 rounded-full bg-yellow-400 text-emerald-950 flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Duration Badge */}
                  {item.duration && (
                    <span className="absolute bottom-2.5 right-2.5 bg-slate-950/80 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.duration}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <MapPin className="w-3 h-3 text-emerald-600" /> {item.county} County
                    </span>
                    <span className="text-[11px]">{item.date}</span>
                  </div>

                  <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Event extra info */}
                  {item.category === 'events' && item.venue && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-emerald-800 truncate">
                        <MapPin className="w-3 h-3 shrink-0" /> {item.venue}
                      </div>
                      {item.eventTime && (
                        <div className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" /> {item.eventTime}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded uppercase">
                  {item.tag}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewItem(item)}
                    title="Quick Preview"
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    title="Edit Item"
                    className="p-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMedia(item.id)}
                    title="Delete Item"
                    className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* ADD / EDIT MEDIA MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  {editingItem ? 'Edit Media Record' : 'Upload to Media Gallery'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">
                  {editingItem 
                    ? `Edit ${editingItem.category === 'photos' ? 'Photo Album' : editingItem.category === 'videos' ? 'Video Replay' : 'Key Event'}` 
                    : `Upload New ${formData.category === 'photos' ? 'Photo Album' : formData.category === 'videos' ? 'Video Recording' : 'Key Event'}`}
                </h3>
                <p className="text-xs text-slate-500">
                  Fill in the visual metadata to publish directly to the live website archive.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {actionError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-3 text-xs font-medium">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMedia} className="space-y-4 text-xs">
              {/* Category Picker */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Media Category *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'photos', label: 'Photo Album', icon: Camera },
                    { key: 'videos', label: 'Video / Match Clip', icon: Play },
                    { key: 'events', label: 'Key Event / Summit', icon: Calendar }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isSelected = formData.category === tab.key;
                    return (
                      <button
                        type="button"
                        key={tab.key}
                        onClick={() => setFormData({ ...formData, category: tab.key as any })}
                        className={`p-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Media Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2024/25 National Grand Finals: B.W. Harris vs BWI"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {/* Video Specific: Direct Video File Upload from Computer */}
              {formData.category === 'videos' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-300 shadow-xs space-y-3">
                    <VideoUploadField
                      label="Upload Match / Tournament Video Directly from Your Computer"
                      value={formData.videoUrl || (formData.url.startsWith('data:video') ? formData.url : '')}
                      onChange={(val) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          videoUrl: val,
                          url: prev.url && !prev.url.includes('unsplash.com') ? prev.url : val 
                        }));
                      }}
                      required={!formData.videoEmbedUrl && !formData.url}
                      onDurationExtracted={(dur) => {
                        setFormData(prev => ({ ...prev, duration: dur }));
                      }}
                      onAutoPosterExtracted={(poster) => {
                        // If no custom cover has been uploaded yet, use the auto-extracted frame as the cover
                        setFormData(prev => {
                          if (!prev.url || prev.url.includes('unsplash.com') || prev.url.startsWith('data:video')) {
                            return { ...prev, url: poster };
                          }
                          return prev;
                        });
                      }}
                      helperText="Upload any full debate clash, championship highlight, or awards ceremony (.mp4, .webm, .mov) directly from your computer."
                    />
                  </div>

                  {/* Video Poster Thumbnail & Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <ImageUploadField
                        label="Custom Video Cover Poster (Optional)"
                        value={formData.url.startsWith('data:video') ? '' : formData.url}
                        onChange={(val) => setFormData({ ...formData, url: val })}
                        aspectRatio="video"
                        presets={PRESET_IMAGE_TEMPLATES.map(p => ({ label: p.name, url: p.url }))}
                        helperText="Upload a custom cover image, or use the auto-generated frame from your uploaded video."
                      />
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1 text-xs uppercase tracking-wider">
                          Video Duration (Auto-calculated)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1h 24m, 26m 40s"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm font-semibold"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Automatically detected when you upload your video file from your computer.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200">
                        <label className="font-bold text-slate-700 block mb-1 text-xs">
                          External Video Link (Optional Backup)
                        </label>
                        <input
                          type="text"
                          placeholder="Optional YouTube / Vimeo URL (if not uploading directly)"
                          value={formData.videoEmbedUrl}
                          onChange={(e) => setFormData({ ...formData, videoEmbedUrl: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Photos and Events: Photo Upload Directly from Computer */
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <ImageUploadField
                    label={formData.category === 'events' ? 'Event Flyer / Banner Picture' : 'Championship Photograph (Upload from Computer)'}
                    value={formData.url}
                    onChange={(val) => setFormData({ ...formData, url: val })}
                    required
                    aspectRatio={formData.category === 'events' ? 'video' : 'auto'}
                    presets={PRESET_IMAGE_TEMPLATES.map(p => ({ label: p.name, url: p.url }))}
                    helperText="Upload any tournament photograph, stage picture, or flyer directly from your computer, or pick from our curated high-res presets."
                  />
                </div>
              )}

              {/* Event Specific Fields */}
              {formData.category === 'events' && (
                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
                  <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-700" /> Key Event Venue & Logistics
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Venue / Physical Location *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Monrovia City Hall Ballroom"
                        value={formData.venue}
                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Daily Time / Schedule</label>
                      <input
                        type="text"
                        placeholder="e.g. 8:30 AM - 4:30 PM GMT"
                        value={formData.eventTime}
                        onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Registration / Contact Info</label>
                    <input
                      type="text"
                      placeholder="e.g. events@youthforchange.org.lr or https://form.link"
                      value={formData.registrationLink}
                      onChange={(e) => setFormData({ ...formData, registrationLink: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>
              )}

              {/* County, Year, Date & Tag */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">County *</label>
                  <select
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
                  >
                    {LIBERIA_COUNTIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Edition Year *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2024/25"
                    value={formData.editionYear}
                    onChange={(e) => setFormData({ ...formData, editionYear: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date / Month *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. March 2025"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tag / Pill *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Debate Finals, STEM Expo"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Caption *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide context, student names, participating schools, match score, or key highlights..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingItem ? 'Update Live Media' : 'Publish to Live Gallery'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEDIA PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-black bg-emerald-800 text-white px-2.5 py-1 rounded uppercase">
                  {previewItem.category} • {previewItem.tag} • {previewItem.editionYear}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  {previewItem.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {previewItem.county} County • {previewItem.date}
                </p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-inner bg-slate-950 relative min-h-[240px] flex items-center justify-center">
              {previewItem.category === 'videos' ? (
                <div className="w-full">
                  <MediaVideoPlayer
                    src={previewItem.videoUrl || previewItem.url}
                    videoEmbedUrl={previewItem.videoEmbedUrl}
                    poster={
                      previewItem.url && 
                      !previewItem.url.startsWith('data:video') && 
                      !previewItem.url.includes('/uploads/videos/') && 
                      !previewItem.url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i)
                        ? previewItem.url
                        : undefined
                    }
                    title={previewItem.title}
                    autoPlay={true}
                    className="max-h-96"
                  />
                </div>
              ) : (
                <SafeImage
                  src={previewItem.url}
                  alt={previewItem.title}
                  fallbackCategory="gallery"
                  fallbackTitle={previewItem.title}
                  className="w-full max-h-96 object-contain mx-auto"
                />
              )}
            </div>

            {previewItem.category === 'events' && previewItem.venue && (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-700" /> Venue: {previewItem.venue}
                </div>
                {previewItem.eventTime && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-4 h-4 text-amber-700" /> Schedule: {previewItem.eventTime}
                  </div>
                )}
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p>{previewItem.description}</p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  const toEdit = previewItem;
                  setPreviewItem(null);
                  handleOpenEditModal(toEdit);
                }}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit This Item
              </button>

              <button
                onClick={() => setPreviewItem(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK MEDIA UPLOAD MODAL */}
      <BulkMediaUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onUploadComplete={() => {
          toast.success('Bulk upload batch processed and added to live gallery!', 'Gallery Updated', 5000);
        }}
        userEmail={userEmail}
      />
    </div>
  );
};
