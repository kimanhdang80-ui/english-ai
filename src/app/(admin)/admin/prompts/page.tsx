import type { Metadata } from 'next';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ai } from '@/modules/ai/infrastructure/container';

export const metadata: Metadata = { title: 'Prompt Library' };

/** Prompt Library — lists registered prompt templates (data from the registry). */
export default async function PromptLibraryPage() {
  const templates = await ai.templates.listTemplates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prompt Library</h1>
        <p className="text-sm text-muted-foreground">
          Versioned prompt templates (prompts are data, never inline in code).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle className="text-base">{t.name}</CardTitle>
              <CardDescription>
                <code className="text-xs">{t.key}</code> · {t.category} · active
                v{t.activeVersion ?? '—'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-sm text-muted-foreground">
                {t.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {t.variables.map((v) => (
                  <span
                    key={v.name}
                    className="rounded-full border px-2 py-0.5 text-xs"
                    title={v.description}
                  >
                    {'{{'}
                    {v.name}
                    {'}}'}
                    {v.required ? ' *' : ''}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
