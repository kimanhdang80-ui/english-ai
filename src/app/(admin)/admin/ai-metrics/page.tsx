import type { Metadata } from 'next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ai } from '@/modules/ai/infrastructure/container';

export const metadata: Metadata = { title: 'AI Metrics' };

const WINDOW_HOURS = 24;

/**
 * AI Metrics Dashboard (RC-04) — operational observability over `ai_usage_logs`:
 * Requests · Success Rate · Latency · Tokens · Cost · Fallback Count, plus per-model and
 * per-feature breakdowns. Read-only ops view; not a learning feature. Admin-gated + dynamic.
 */
export default async function AiMetricsPage() {
  const health = await ai.health.report(WINDOW_HOURS);

  if (!ai.metrics) {
    return (
      <div className="space-y-4">
        <Header />
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Metrics require a configured database (`DATABASE_URL`). Provider:{' '}
            <strong>{health.provider}</strong> · configured:{' '}
            <strong>{String(health.configured)}</strong> · circuit:{' '}
            <strong>{health.circuit}</strong>.
          </CardContent>
        </Card>
      </div>
    );
  }

  const m = await ai.metrics.summary(WINDOW_HOURS);

  const stats = [
    { label: 'Requests', value: fmtInt(m.requests) },
    { label: 'Success rate', value: fmtPct(m.successRate) },
    { label: 'Fallback count', value: fmtInt(m.fallbackCount) },
    { label: 'Failed', value: fmtInt(m.failedCount) },
    { label: 'Avg latency', value: `${fmtInt(m.avgLatencyMs)} ms` },
    { label: 'Tokens', value: fmtInt(m.totalTokens) },
    { label: 'Cost (est.)', value: fmtUsd(m.costUsd) },
    {
      label: 'Health',
      value: `${health.status} · circuit ${health.circuit}`,
    },
  ];

  return (
    <div className="space-y-6">
      <Header />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By model</CardTitle>
          </CardHeader>
          <CardContent>
            {m.byModel.length === 0 ? (
              <Empty />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-1">Model</th>
                    <th className="py-1 text-right">Req</th>
                    <th className="py-1 text-right">Tokens</th>
                    <th className="py-1 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {m.byModel.map((row) => (
                    <tr key={row.model} className="border-t">
                      <td className="py-1 font-mono text-xs">{row.model}</td>
                      <td className="py-1 text-right">
                        {fmtInt(row.requests)}
                      </td>
                      <td className="py-1 text-right">
                        {fmtInt(row.tokensIn + row.tokensOut)}
                      </td>
                      <td className="py-1 text-right">
                        {fmtUsd(row.costMicroUsd / 1_000_000)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By feature</CardTitle>
          </CardHeader>
          <CardContent>
            {m.byFeature.length === 0 ? (
              <Empty />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-1">Feature</th>
                    <th className="py-1 text-right">Requests</th>
                  </tr>
                </thead>
                <tbody>
                  {m.byFeature.map((row) => (
                    <tr key={row.feature} className="border-t">
                      <td className="py-1">{row.feature}</td>
                      <td className="py-1 text-right">
                        {fmtInt(row.requests)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-bold">AI Metrics</h1>
      <p className="text-sm text-muted-foreground">
        Provider calls over the last {WINDOW_HOURS}h (from `ai_usage_logs`).
        Cost is estimated from model pricing — see AI_COST_GUIDE.md.
      </p>
    </div>
  );
}

function Empty() {
  return (
    <p className="py-4 text-sm text-muted-foreground">
      No AI calls recorded in this window yet.
    </p>
  );
}

const fmtInt = (n: number): string => n.toLocaleString('en-US');
const fmtPct = (r: number): string => `${(r * 100).toFixed(1)}%`;
const fmtUsd = (usd: number): string => `$${usd.toFixed(4)}`;
