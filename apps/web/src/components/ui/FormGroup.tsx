import React from 'react';
import { cn } from '../../lib/utils.js';

interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, children, error, required, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'space-y-2',
          error && 'space-y-1',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormGroup.displayName = 'FormGroup';

export { FormGroup };
export type { FormGroupProps };