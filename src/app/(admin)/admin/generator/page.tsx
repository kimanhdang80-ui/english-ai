import type { Metadata } from 'next';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ai } from '@/modules/ai/infrastructure/container';

export const metadata: Metadata = { title: 'Lesson Generator' };

/**
 * Generator — placeholder (Sprint 7.1 foundation). Prompt building/preview is available
 * (AI-free); actual generation is disabled until a provider is configured.
 */
export default async function GeneratorPage() {
  const templates = await ai.templates.listTemplates();
  const providerConfigured = ai.llm.configured;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lesson Generator</h1>
        <p className="text-sm text-muted-foreground">
          Build a prompt from a template, preview it, and (later) generate
          content.
        </p>
      </div>

      {!providerConfigured ? (
        <Alert variant="info">
          <AlertDescription>
            No AI provider is configured (foundation only). Prompt preview
            works; generation returns <code>501 NOT_IMPLEMENTED</code> until a
            provider adapter is wired via the container.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Choose a template</CardTitle>
          <CardDescription>
            The generator renders <code>{'{{VARIABLE}}'}</code> tokens with your
            inputs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {templates.map((t) => (
              <li key={t.id} className="py-3">
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-muted-foreground">
                  Variables:{' '}
                  {t.variables
                    .map((v) => `${v.name}${v.required ? '*' : ''}`)
                    .join(', ')}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            The interactive form + live preview arrive with the provider
            integration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
