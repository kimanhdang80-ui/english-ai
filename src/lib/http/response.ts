import { NextResponse } from 'next/server';

import { DomainError } from '@/lib/errors';
import type { Page } from '@/modules/learning/domain/pagination';

/**
 * Standard API response envelope (API.md §1.1) + domain-error → HTTP mapping.
 * Presentation-layer helper shared by Route Handlers.
 */

function requestId(): string {
  return crypto.randomUUID();
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    { data, meta: { requestId: requestId() } },
    { status },
  );
}

export function okPage<T>(page: Page<T>): NextResponse {
  return NextResponse.json({
    data: page.items,
    meta: {
      page: page.page,
      pageSize: page.pageSize,
      total: page.total,
      requestId: requestId(),
    },
  });
}

export function fail(
  code: string,
  message: string,
  status: number,
  details?: unknown,
): NextResponse {
  return NextResponse.json(
    { error: { code, message, details, requestId: requestId() } },
    { status },
  );
}

const STATUS_BY_CODE: Record<string, number> = {
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  CONFLICT: 409,
  NOT_IMPLEMENTED: 501,
};

/** Translate any thrown error into the error envelope. */
export function handleError(err: unknown): NextResponse {
  if (err instanceof DomainError) {
    return fail(err.code, err.message, STATUS_BY_CODE[err.code] ?? 500);
  }
  // Do not leak internals.
  return fail('INTERNAL', 'An unexpected error occurred.', 500);
}

/** Require a query param or throw a ValidationError-shaped 400. */
export function requireParam(
  value: string | null,
  name: string,
): NextResponse | null {
  if (!value) {
    return fail(
      'VALIDATION_ERROR',
      `Missing required query param: ${name}`,
      400,
    );
  }
  return null;
}
