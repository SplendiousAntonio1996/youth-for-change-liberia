import { useState, useEffect } from 'react';
import { LeaderMember } from '../types';
import { subscribeToLeadership } from '../lib/leadershipService';

export function useLeadership() {
  const [leaders, setLeaders] = useState<LeaderMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToLeadership((updatedLeaders) => {
      setLeaders(updatedLeaders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { 
    leaders, 
    activeLeaders: leaders.filter(l => l.active !== false),
    loading 
  };
}
