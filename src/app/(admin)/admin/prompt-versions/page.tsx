import type { Metadata } from 'next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ai } from '@/modules/ai/infrastructure/container';

export const metadata: Metadata = { title: 'Prompt Versions' };

/** Prompt Versions — lists versions per template (read-only; authoring is future work). */
export default async function PromptVersionsPage() {
  const templates = await ai.templates.listTemplates();
  const groups = await Promise.all(
    templates.map(async (t) => ({
      template: t,
      versions: await ai.templates.listVersions(t.id),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prompt Versions</h1>
        <p className="text-sm text-muted-foreground">
          Every template is versioned; one version is active. Create/publish
          arrives with authoring.
        </p>
      </div>

      {groups.map(({ template, versions }) => (
        <Card key={template.id}>
          <CardHeader>
            <CardTitle className="text-base">{template.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span>
                    v{v.version} · <span className="uppercase">{v.status}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {v.model} · {v.maxOutputTokens} tok
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
