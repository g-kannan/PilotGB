import React from 'react';
import { cn } from '../../lib/utils.js';

type InitiativeStatus = 'on-track' | 'at-risk' | 'blocked' | 'complete' | 'archived';

interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: InitiativeStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ 
    className, 
    status, 
    size = 'md', 
    showLabel = true, 
    label,
    ...props 
  }, ref) => {
    const statusConfig = {
      'on-track': {
        color: 'bg-status-on-track',
        label: 'On Track',
        icon: '✓',
      },
      'at-risk': {
        color: 'bg-status-at-risk',
        label: 'At Risk',
        icon: '⚠',
      },
      'blocked': {
        color: 'bg-status-blocked',
        label: 'Blocked',
        icon: '⚠',
      },
      'complete': {
        color: 'bg-status-complete',
        label: 'Complete',
        icon: '✓',
      },
      'archived': {
        color: 'bg-status-archived',
        label: 'Archived',
        icon: '📁',
      },
    };

    const config = statusConfig[status];
    const displayLabel = label || config.label;

    const baseStyles = [
      'inline-flex items-center gap-2',
      'font-medium text-white rounded-full',
      'transition-all duration-200',
    ];

    const sizes = {
      sm: showLabel ? 'px-2 py-1 text-xs' : 'w-2 h-2',
      md: showLabel ? 'px-3 py-1.5 text-sm' : 'w-3 h-3',
      lg: showLabel ? 'px-4 py-2 text-base' : 'w-4 h-4',
    };

    const dotSizes = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5',
    };

    if (!showLabel) {
      return (
        <div
          ref={ref}
          className={cn(
            'rounded-full',
            config.color,
            sizes[size],
            className
          )}
          title={displayLabel}
          aria-label={displayLabel}
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          config.color,
          sizes[size],
          className
        )}
        aria-label={displayLabel}
        {...props}
      >
        <div className={cn('rounded-full bg-white/20', dotSizes[size])} />
        <span>{displayLabel}</span>
      </div>
    );
  }
);

StatusIndicator.displayName = 'StatusIndicator';

export { StatusIndicator };
export type { StatusIndicatorProps, InitiativeStatus };