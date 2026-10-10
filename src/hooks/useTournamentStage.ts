import { useState, useEffect } from 'react';
import { 
  TournamentStageProgressionState,
  DEFAULT_STAGE_PROGRESSION,
  subscribeToTournamentStage,
  updateTournamentStageProgression,
  isDeadlineExpired,
  getDaysRemainingUntilDeadline,
  checkStage1Status,
  checkStage2Status,
  advanceTournamentToStage2,
  advanceTournamentToStage3
} from '../lib/tournamentStageService';
import { TournamentFixture, DebateMotion } from '../types/tournament';

export function useTournamentStage() {
  const [stageState, setStageState] = useState<TournamentStageProgressionState>(DEFAULT_STAGE_PROGRESSION);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToTournamentStage((newState) => {
      setStageState(newState);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isDeadlinePassed = isDeadlineExpired(
    stageState.registrationDeadline,
    stageState.registrationDeadlineDate
  );

  const daysRemaining = getDaysRemainingUntilDeadline(
    stageState.registrationDeadlineDate,
    stageState.registrationDeadline
  );

  // Helper: check if a stage is locked
  const isStageLocked = (stage: 'county_prelims' | 'central_stage' | 'grand_final_third_place'): boolean => {
    if (stage === 'county_prelims') {
      return stageState.stage1Locked;
    }
    if (stage === 'central_stage') {
      return stageState.stage2Locked;
    }
    if (stage === 'grand_final_third_place') {
      return stageState.stage3Locked;
    }
    return false;
  };

  // Helper: check if a stage is currently active/ongoing
  const isStageActive = (stage: 'county_prelims' | 'central_stage' | 'grand_final_third_place'): boolean => {
    return stageState.currentStage === stage;
  };

  const updateStage = async (
    updates: Partial<TournamentStageProgressionState>,
    adminEmail?: string
  ) => {
    const updated = await updateTournamentStageProgression(updates, adminEmail);
    setStageState(updated);
    return updated;
  };

  const updateDeadline = async (
    deadlineLabel: string,
    deadlineDate: string,
    adminEmail?: string
  ) => {
    const updated = await updateTournamentStageProgression({
      registrationDeadline: deadlineLabel,
      registrationDeadlineDate: deadlineDate
    }, adminEmail);
    setStageState(updated);
    return updated;
  };

  return {
    stageState,
    loading,
    isDeadlinePassed,
    daysRemaining,
    isStageLocked,
    isStageActive,
    updateStage,
    updateDeadline,
    checkStage1Status,
    checkStage2Status,
    advanceTournamentToStage2,
    advanceTournamentToStage3
  };
}
