import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Presentational placeholder used by Learning Engine screens (Sprint 3.1 = layout
 * only). Keeps pages free of markup/logic per the layering rule.
 */
export function LearnPlaceholder({
  title,
  description,
  breadcrumb,
  children,
}: {
  title: string;
  description: string;
  breadcrumb?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {breadcrumb ? (
        <div className="text-sm text-muted-foreground">{breadcrumb}</div>
      ) : null}
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

/** Empty-state card — no demo data is rendered (Sprint 3.1 constraint). */
export function EmptyState({
  title = 'Nothing here yet',
  hint,
}: {
  title?: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {hint ? <CardDescription>{hint}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <div className="flex h-28 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          Content will appear once authoring lands.
        </div>
      </CardContent>
    </Card>
  );
}
