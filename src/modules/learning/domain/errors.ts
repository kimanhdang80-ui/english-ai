/**
 * Learning Engine — domain errors.
 * Re-exported from the shared error module so both modules and the presentation
 * layer share one `DomainError` hierarchy (a single `instanceof` check works).
 */
export {
  DomainError,
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  NotImplementedError,
} from '@/lib/errors';
