import { cn } from '@/lib/utils';

/**
 * Skeleton placeholder — a pulsing block used for loading states (UI_GUIDELINE §5).
 * Pure presentational; sizes via className. Uses the design-token `bg-muted`.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}
