import React from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  hover = false,
  onClick,
  style,
}) => (
  <div
    onClick={onClick}
    style={style}
    className={cn(
      'bg-white rounded-xl border border-gray-200/80 shadow-sm',
      paddingClasses[padding],
      hover && 'hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer',
      className
    )}
  >
    {children}
  </div>
);
