'use client';

import { useFormStatus } from 'react-dom';

import { Button, type ButtonProps } from '@/components/ui/button';

/** Submit button that shows a pending label while the server action runs. */
export function SubmitButton({
  children,
  pendingText = 'Please wait…',
  ...props
}: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
