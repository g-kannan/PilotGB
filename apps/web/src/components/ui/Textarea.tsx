import React from 'react';
import { cn } from '../../lib/utils.js';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  success?: boolean;
  label?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    error, 
    success, 
    label, 
    helperText, 
    id, 
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const hasSuccess = success && !hasError;

    const baseStyles = [
      'flex w-full rounded-lg border px-3 py-2',
      'text-base placeholder:text-text-muted',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'resize-vertical min-h-[80px]',
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
            htmlFor={textareaId}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
            {props.required && <span className="text-status-blocked ml-1">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            baseStyles,
            stateStyles[currentState],
            className
          )}
          ref={ref}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${textareaId}-error` : 
            helperText ? `${textareaId}-helper` : 
            undefined
          }
          {...props}
        />
        {error && (
          <p 
            id={`${textareaId}-error`}
            className="text-sm text-status-blocked flex items-center gap-1"
            role="alert"
          >
            <span className="text-xs">⚠</span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p 
            id={`${textareaId}-helper`}
            className="text-sm text-text-muted"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
export type { TextareaProps };