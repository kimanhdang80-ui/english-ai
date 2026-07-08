import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loading state for the Learning Dashboard — mirrors the section layout so the
 * page doesn't jump when data arrives (UI_GUIDELINE §5).
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-14 w-24" />
      </div>

      {/* Today's Mission */}
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>

      {/* Review + Coach */}
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>

      {/* Weekly */}
      <Skeleton className="h-48 w-full rounded-xl" />

      {/* Weak words + Recent */}
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>
    </div>
  );
}
