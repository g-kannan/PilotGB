import React from 'react';
import { cn } from '../../lib/utils.js';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    disabled, 
    icon, 
    children, 
    ...props 
  }, ref) => {
    const baseStyles = [
      'inline-flex items-center justify-center gap-2',
      'font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'relative overflow-hidden',
    ];

    const variants = {
      primary: [
        'bg-gradient-primary text-white shadow-button',
        'hover:shadow-lg hover:scale-[1.02]',
        'focus:ring-accent/50',
        'active:scale-[0.98]',
      ],
      secondary: [
        'bg-gradient-secondary text-white shadow-md',
        'hover:shadow-lg hover:scale-[1.02]',
        'focus:ring-gray-500/50',
        'active:scale-[0.98]',
      ],
      ghost: [
        'bg-transparent text-text-primary border border-surface-border',
        'hover:bg-surface-panel hover:shadow-sm',
        'focus:ring-accent/30',
        'active:bg-gray-50',
      ],
      danger: [
        'bg-gradient-danger text-white shadow-md',
        'hover:shadow-lg hover:scale-[1.02]',
        'focus:ring-red-500/50',
        'active:scale-[0.98]',
      ],
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-md min-h-[32px]',
      md: 'px-4 py-2 text-base rounded-lg min-h-[40px]',
      lg: 'px-6 py-3 text-lg rounded-xl min-h-[48px]',
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          </div>
        )}
        <div className={cn('flex items-center gap-2', loading && 'opacity-0')}>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </div>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };