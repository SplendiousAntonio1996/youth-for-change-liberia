import { useState, useEffect } from 'react';
import { AlumniProfile, AlumniTestimonial } from '../types';
import { subscribeToAlumni, subscribeToTestimonials } from '../lib/alumniService';

export function useAlumni() {
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAlumni((data) => {
      setProfiles(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Only display profiles that are explicitly approved and active
  const activeProfiles = profiles.filter(p => p.approved === true && p.status === 'active');

  return {
    profiles,
    activeProfiles,
    loading
  };
}

export function useTestimonials() {
  const [testimonials, setTestimonials] = useState<AlumniTestimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToTestimonials((data) => {
      setTestimonials(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Only display testimonials that are verified by administrators for public view
  const verifiedTestimonials = testimonials.filter(t => t.verified === true);
  const featuredTestimonials = verifiedTestimonials.filter(t => t.featured);
  const videoTestimonials = verifiedTestimonials.filter(t => Boolean(t.videoUrl));

  return {
    testimonials,
    verifiedTestimonials,
    featuredTestimonials,
    videoTestimonials,
    loading
  };
}
