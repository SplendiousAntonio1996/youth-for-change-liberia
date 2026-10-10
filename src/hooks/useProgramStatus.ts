import { useState, useEffect } from 'react';
import { ProgramStatus } from '../types';
import { 
  DEFAULT_PROGRAM_STATUSES, 
  subscribeToProgramStatuses, 
  updateProgramStatus as serviceUpdateProgramStatus,
  batchSetAllProgramStatuses as serviceBatchSetAllProgramStatuses
} from '../lib/programStatusService';

export function useProgramStatus() {
  const [statusesMap, setStatusesMap] = useState<Record<string, ProgramStatus>>(DEFAULT_PROGRAM_STATUSES);
  const [statusesList, setStatusesList] = useState<ProgramStatus[]>(Object.values(DEFAULT_PROGRAM_STATUSES));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToProgramStatuses((map, list) => {
      setStatusesMap(map);
      setStatusesList(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isProgramOpen = (programId: string): boolean => {
    if (statusesMap[programId]) {
      return statusesMap[programId].isOpen;
    }
    return DEFAULT_PROGRAM_STATUSES[programId]?.isOpen ?? false;
  };

  const getProgramStatus = (programId: string): ProgramStatus => {
    return statusesMap[programId] || DEFAULT_PROGRAM_STATUSES[programId] || {
      id: programId,
      programId: programId,
      title: programId,
      isOpen: false,
      statusLabel: 'Closed - Not Open Yet',
      closedNotice: 'Registration for this program is not open yet.'
    };
  };

  const updateStatus = async (
    programId: string, 
    updates: Partial<ProgramStatus>, 
    adminEmail?: string
  ) => {
    await serviceUpdateProgramStatus(programId, updates, adminEmail);
  };

  const batchUpdate = async (
    statusUpdates: Record<string, boolean>, 
    adminEmail?: string
  ) => {
    await serviceBatchSetAllProgramStatuses(statusUpdates, adminEmail);
  };

  return {
    statusesMap,
    statusesList,
    loading,
    isProgramOpen,
    getProgramStatus,
    updateStatus,
    batchUpdate
  };
}
