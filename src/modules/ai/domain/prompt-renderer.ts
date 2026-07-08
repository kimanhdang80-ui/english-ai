/**
 * Prompt renderer (pure). Substitutes `{{VARIABLE}}` tokens with values and reports
 * any tokens left unresolved (missing/empty). No template strings live in services —
 * bodies come from the versioned template registry.
 */

export interface RenderResult {
  rendered: string;
  /** Token names present in the body but without a (non-empty) value. */
  missing: string[];
}

function tokenRegex(): RegExp {
  return /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;
}

export class PromptRenderer {
  render(body: string, variables: Record<string, string>): RenderResult {
    const missing = new Set<string>();
    const rendered = body.replace(
      tokenRegex(),
      (_match: string, name: string) => {
        const value = variables[name];
        if (value === undefined || value.trim() === '') {
          missing.add(name);
          return `{{${name}}}`;
        }
        return value;
      },
    );
    return { rendered, missing: [...missing] };
  }

  /** All distinct token names declared in a body. */
  tokens(body: string): string[] {
    const found = new Set<string>();
    for (const match of body.matchAll(tokenRegex())) {
      if (match[1]) found.add(match[1]);
    }
    return [...found];
  }
}
