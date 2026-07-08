/**
 * Shared Server-Sent Events (SSE) helpers for streaming providers. The framing parse is a
 * pure function (`parseSseBuffer`) so it is fully unit-testable without a network stream;
 * `readSseData` drives it over a `fetch` response body.
 */

export interface SseParseResult {
  /** Complete `data:` payloads parsed out of the buffer (excludes `[DONE]`). */
  events: string[];
  /** Trailing partial event kept for the next chunk. */
  rest: string;
}

/**
 * Splits an SSE text buffer into complete `data:` payloads. Events are separated by a
 * blank line (`\n\n`); each event may carry multiple `data:` lines (concatenated per spec).
 * The unterminated tail is returned as `rest` to be prepended to the next chunk.
 */
export function parseSseBuffer(buffer: string): SseParseResult {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const parts = normalized.split('\n\n');
  const rest = parts.pop() ?? '';
  const events: string[] = [];

  for (const block of parts) {
    const data = block
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    if (data.length === 0 || data === '[DONE]') continue;
    events.push(data);
  }

  return { events, rest };
}

/**
 * Reads a `fetch` response body as a stream of SSE `data:` payloads (strings). Decodes
 * incrementally and yields each complete event's data as soon as it arrives.
 */
export async function* readSseData(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSseBuffer(buffer);
      buffer = rest;
      for (const event of events) yield event;
    }
    // Flush any final complete event without a trailing blank line.
    const { events } = parseSseBuffer(buffer + '\n\n');
    for (const event of events) yield event;
  } finally {
    reader.releaseLock();
  }
}
