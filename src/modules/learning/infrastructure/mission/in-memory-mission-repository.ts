import type { Mission } from '@/modules/learning/domain/mission/entities';
import type { MissionRepository } from '@/modules/learning/application/mission/ports';

/**
 * In-memory mission store — **TEST-ONLY fake** (RC-03). The runtime now uses
 * `PrismaMissionRepository`, which reads the Mission Library from `content_missions`
 * (ADR-0005). This double is retained only for fast Mission Engine unit tests; not wired
 * into any container. Empty by default — populated via the constructor seed.
 */
export class InMemoryMissionRepository implements MissionRepository {
  private readonly byId = new Map<string, Mission>();

  constructor(seed: Mission[] = []) {
    for (const m of seed) this.byId.set(m.id, m);
  }

  async findById(id: string): Promise<Mission | null> {
    return this.byId.get(id) ?? null;
  }

  async listByTrack(trackId: string): Promise<Mission[]> {
    return [...this.byId.values()].filter((m) => m.trackId === trackId);
  }

  async save(mission: Mission): Promise<void> {
    this.byId.set(mission.id, mission);
  }
}
