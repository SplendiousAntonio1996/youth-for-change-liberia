import { useState, useEffect } from 'react';
import { DebateEdition } from '../types';
import { subscribeToDebateEditions } from '../lib/debateService';
import { DEBATE_EDITIONS as DEFAULT_DEBATE_EDITIONS } from '../data/debateData';

export function useDebateEditions() {
  const [editionsMap, setEditionsMap] = useState<Record<string, DebateEdition>>(DEFAULT_DEBATE_EDITIONS);
  const [editionsList, setEditionsList] = useState<DebateEdition[]>(
    Object.values(DEFAULT_DEBATE_EDITIONS).sort((a, b) => {
      const numA = parseInt(a.year.substring(0, 4)) || 0;
      const numB = parseInt(b.year.substring(0, 4)) || 0;
      return numB - numA;
    })
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToDebateEditions((map, list) => {
      setEditionsMap(map);
      setEditionsList(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { editionsMap, editionsList, loading };
}
