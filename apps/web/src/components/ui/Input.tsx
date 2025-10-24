import React from 'react';
import { cn } from '../../lib/utils.js';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  success?: boolean;
  label?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text', 
    error, 
    success, 
    label, 
    helperText, 
    id, 
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const hasSuccess = success && !hasError;

    const baseStyles = [
      'flex w-full rounded-lg border px-3 py-2',
      'text-base placeholder:text-text-muted',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      'disabled:cursor-not-allowed disabled:opacity-50',
    ];

    const stateStyles = {
      default: [
        'border-surface-border bg-surface-panel',
        'focus:border-accent focus:ring-accent/30',
        'hover:border-accent/50',
      ],
      error: [
        'border-status-blocked bg-red-50',
        'focus:border-status-blocked focus:ring-red-500/30',
        'text-red-900 placeholder:text-red-400',
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
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
            {props.required && <span className="text-status-blocked ml-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            baseStyles,
            stateStyles[currentState],
            className
          )}
          ref={ref}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${inputId}-error` : 
            helperText ? `${inputId}-helper` : 
            undefined
          }
          {...props}
        />
        {error && (
          <p 
            id={`${inputId}-error`}
            className="text-sm text-status-blocked flex items-center gap-1"
            role="alert"
          >
            <span className="text-xs">⚠</span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p 
            id={`${inputId}-helper`}
            className="text-sm text-text-muted"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };