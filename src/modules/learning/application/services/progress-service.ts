import { NotImplementedError } from '@/modules/learning/domain/errors';
import type { ProgressInput } from '@/modules/learning/domain/entities';

/**
 * Progress use cases.
 *
 * INTERFACE/SKELETON ONLY (Sprint 3.1). Progress persistence needs the learner
 * progress schema (user_progress, attempts, SRS) which is out of scope this sprint —
 * so `recordProgress` throws `NotImplementedError` (surfaced as HTTP 501). The
 * contract is fixed here so the API and UI can integrate against it now.
 */
export class ProgressService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async recordProgress(_input: ProgressInput): Promise<never> {
    throw new NotImplementedError('ProgressService.recordProgress');
  }
}
