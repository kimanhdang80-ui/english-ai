import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-md border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          'border-destructive/50 text-destructive [&>svg]:text-destructive',
        success: 'border-success/50 text-success [&>svg]:text-success',
        info: 'border-primary/40 text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Alert({
  className,
  variant,
  role = 'alert',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role={role}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'h5'>) {
  return (
    <h5
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
