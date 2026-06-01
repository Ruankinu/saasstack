import React from 'react';
import { cn } from '@/utils/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercent = true,
  size = 'md',
  className,
}) => {
  const percent = Math.min((value / max) * 100, 100);
  const colorClass =
    percent > 100 ? 'bg-danger-500' :
    percent > 85 ? 'bg-warning-500' :
    percent > 60 ? 'bg-primary-500' :
    'bg-accent-500';

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-4' : 'h-2.5';

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs font-medium text-gray-600">{label}</span>}
          {showPercent && (
            <span className={cn('text-xs font-semibold', {
              'text-danger-600': percent > 100,
              'text-warning-600': percent > 85 && percent <= 100,
              'text-primary-600': percent > 60 && percent <= 85,
              'text-accent-600': percent <= 60,
            })}>
              {percent.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-gray-100 rounded-full overflow-hidden', heightClass)}>
        <div
          className={cn('rounded-full transition-all duration-700 ease-out', colorClass, heightClass)}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
};
