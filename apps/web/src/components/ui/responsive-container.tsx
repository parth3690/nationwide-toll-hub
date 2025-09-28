/**
 * Elite Responsive Container Component
 * 
 * Flexible container component that adapts to different screen sizes
 * with consistent spacing and layout patterns.
 */

import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  center?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  sm: 'px-2 sm:px-4',
  md: 'px-4 sm:px-6 lg:px-8',
  lg: 'px-6 sm:px-8 lg:px-12',
  xl: 'px-8 sm:px-12 lg:px-16',
};

export function ResponsiveContainer({
  children,
  className,
  maxWidth = '2xl',
  padding = 'md',
  center = true,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        'w-full',
        center && 'mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
