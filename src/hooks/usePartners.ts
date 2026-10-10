import { useState, useEffect } from 'react';
import { PartnerOrg } from '../types';
import { subscribeToApprovedPartners } from '../lib/partnersService';

export function usePartners() {
  const [partners, setPartners] = useState<PartnerOrg[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToApprovedPartners((updatedPartners) => {
      setPartners(updatedPartners);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { partners, loading };
}
