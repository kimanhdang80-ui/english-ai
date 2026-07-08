/**
 * Shared domain errors — used across modules and mapped to HTTP at the
 * presentation boundary (`src/lib/http/response.ts`). Framework-free.
 */

export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id?: string) {
    super(
      id ? `${entity} not found: ${id}` : `${entity} not found`,
      'NOT_FOUND',
    );
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    readonly details?: unknown,
  ) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT');
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Authentication required.') {
    super(message, 'UNAUTHENTICATED');
  }
}

/** Thrown by skeleton use cases whose logic is scheduled for a later sprint. */
export class NotImplementedError extends DomainError {
  constructor(feature: string) {
    super(`Not implemented yet: ${feature}`, 'NOT_IMPLEMENTED');
  }
}
