import React, { useEffect } from 'react';
import { YearlyReportEngine } from './YearlyReportEngine';
import { X } from 'lucide-react';

interface YearlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialYear?: string;
  initialTab?: 'all' | 'charts' | 'achievements' | 'news' | 'fixtures' | 'schools' | 'finance' | 'signatories';
}

export const YearlyReportModal: React.FC<YearlyReportModalProps> = ({
  isOpen,
  onClose,
  initialYear = '2024-25',
  initialTab = 'all'
}) => {
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-start justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl my-4 sm:my-8">
        <YearlyReportEngine
          initialYear={initialYear}
          initialTab={initialTab}
          onClose={onClose}
          isModal={true}
        />
      </div>
    </div>
  );
};
