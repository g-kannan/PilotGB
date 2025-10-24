import React from 'react';
import { cn } from '../../lib/utils.js';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  error?: string;
  success?: boolean;
  label?: string;
  helperText?: string;
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    options,
    error, 
    success, 
    label, 
    helperText, 
    placeholder,
    id, 
    ...props 
  }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const hasSuccess = success && !hasError;

    const baseStyles = [
      'flex w-full rounded-lg border px-3 py-2',
      'text-base bg-surface-panel',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'appearance-none cursor-pointer',
    ];

    const stateStyles = {
      default: [
        'border-surface-border',
        'focus:border-accent focus:ring-accent/30',
        'hover:border-accent/50',
      ],
      error: [
        'border-status-blocked bg-red-50',
        'focus:border-status-blocked focus:ring-red-500/30',
        'text-red-900',
      ],
      success: [
        'border-status-on-track bg-green-50',
        'focus:border-status-on-track focus:ring-green-500/30',
        'text-green-900',
      ],
    };

    const currentState = hasError ? 'error' : hasSuccess ? 'success' : 'default';

    return (
      <div className="space-y-1">
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
            {props.required && <span className="text-status-blocked ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              baseStyles,
              stateStyles[currentState],
              'pr-10', // Space for dropdown arrow
              className
            )}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${selectId}-error` : 
              helperText ? `${selectId}-helper` : 
              undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg 
              className="w-4 h-4 text-text-muted" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 9l-7 7-7-7" 
              />
            </svg>
          </div>
        </div>
        {error && (
          <p 
            id={`${selectId}-error`}
            className="text-sm text-status-blocked flex items-center gap-1"
            role="alert"
          >
            <span className="text-xs">⚠</span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p 
            id={`${selectId}-helper`}
            className="text-sm text-text-muted"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
export type { SelectProps, SelectOption };