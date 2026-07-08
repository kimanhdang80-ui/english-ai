import type { Metadata } from 'next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ai } from '@/modules/ai/infrastructure/container';

export const metadata: Metadata = { title: 'Generation History' };

/**
 * Generation History — placeholder. In-memory + provider-less this sprint, so it is
 * normally empty. Persistent history arrives with the provider + DB gate.
 */
export default async function GenerationHistoryPage() {
  const records = await ai.history.list(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generation History</h1>
        <p className="text-sm text-muted-foreground">
          Past generation requests and results.
        </p>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No history yet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-28 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              Generation is not enabled (no provider). History will appear once
              content is generated and persisted.
            </div>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {records.map((r) => (
            <li key={r.id} className="rounded-md border p-3 text-sm">
              <span className="font-medium">{r.request.templateKey}</span> ·{' '}
              {r.result.status} · {r.occurredAt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
