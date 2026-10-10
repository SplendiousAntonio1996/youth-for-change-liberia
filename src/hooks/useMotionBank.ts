import { useState, useEffect } from 'react';
import { DebateMotion } from '../types/tournament';
import { 
  subscribeToMotionBank, 
  addMotionToBank, 
  updateMotionInBank, 
  deleteMotionFromBank, 
  seedMotionBankDefaults,
  drawRandomMotionFromBank,
  COMPREHENSIVE_OFFICIAL_MOTIONS
} from '../lib/motionBankService';

export function useMotionBank() {
  const [motions, setMotions] = useState<DebateMotion[]>(COMPREHENSIVE_OFFICIAL_MOTIONS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToMotionBank((bank) => {
      setMotions(bank);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addMotion = async (motion: Omit<DebateMotion, 'id'>, adminEmail?: string) => {
    return await addMotionToBank(motion, adminEmail);
  };

  const updateMotion = async (motionId: string, updates: Partial<DebateMotion>) => {
    await updateMotionInBank(motionId, updates);
  };

  const deleteMotion = async (motionId: string) => {
    await deleteMotionFromBank(motionId);
  };

  const seedDefaults = async (adminEmail?: string) => {
    return await seedMotionBankDefaults(adminEmail);
  };

  const pickRandomMotion = (roundStage?: string, usedIds: string[] = []) => {
    return drawRandomMotionFromBank(motions, roundStage, usedIds);
  };

  return {
    motions,
    loading,
    addMotion,
    updateMotion,
    deleteMotion,
    seedDefaults,
    pickRandomMotion
  };
}
