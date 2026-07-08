import type { Metadata } from 'next';

import {
  EmptyState,
  LearnPlaceholder,
} from '@/components/learn/learn-placeholder';

export const metadata: Metadata = { title: 'Course Explorer' };

/** Course Explorer — placeholder layout only (Sprint 3.1). */
export default function CourseExplorerPage() {
  return (
    <LearnPlaceholder
      title="Explore courses"
      description="Browse courses by track and level. (Layout preview — no content yet.)"
    >
      <EmptyState
        title="No courses published"
        hint="Course authoring arrives in a later epic."
      />
    </LearnPlaceholder>
  );
}
