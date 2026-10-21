import React from 'react';

export interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
  showLabel?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  className = '',
  showLabel = false,
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
        <div
          className="bg-brand-600 h-full transition-all duration-300 ease-out rounded-full"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-right text-xs text-slate-500 mt-1">{clamped}%</div>
      )}
    </div>
  );
};
