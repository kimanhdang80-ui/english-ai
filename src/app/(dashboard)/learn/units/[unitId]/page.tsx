import type { Metadata } from 'next';
import Link from 'next/link';

import {
  EmptyState,
  LearnPlaceholder,
} from '@/components/learn/learn-placeholder';

export const metadata: Metadata = { title: 'Unit' };

/** Unit Detail — placeholder layout only (Sprint 3.1). */
export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;

  return (
    <LearnPlaceholder
      title="Unit"
      description="Lessons within this unit will be listed here."
      breadcrumb={
        <Link href="/learn" className="hover:text-foreground">
          ← Courses
        </Link>
      }
    >
      <p className="text-xs text-muted-foreground">Unit ID: {unitId}</p>
      <EmptyState title="No lessons yet" />
    </LearnPlaceholder>
  );
}
