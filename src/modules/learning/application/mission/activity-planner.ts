import {
  ACTIVITY_BUILDERS,
  ACTIVITY_ORDER,
} from '@/modules/learning/domain/mission/activity-builders';
import type {
  Mission,
  MissionActivity,
} from '@/modules/learning/domain/mission/entities';

/**
 * Activity Planner — arranges a mission's activities into the canonical learning order
 * (Vocabulary → Dialogue → Quiz → Review → …) and reports which are runnable now.
 *
 * It does not fabricate content; it orders/annotates what the mission already holds, using
 * the `ACTIVITY_BUILDERS` registry (the extension seam). Placeholder types (listening/
 * speaking) are surfaced as unavailable, never dropped silently.
 */
export class ActivityPlanner {
  /** Activities in canonical order, then by their own sortOrder. */
  order(mission: Mission): MissionActivity[] {
    const rank = new Map(ACTIVITY_ORDER.map((t, i) => [t, i]));
    return mission.activities
      .slice()
      .sort((a, b) => {
        const ra = rank.get(a.type) ?? Number.MAX_SAFE_INTEGER;
        const rb = rank.get(b.type) ?? Number.MAX_SAFE_INTEGER;
        return ra - rb || a.sortOrder - b.sortOrder;
      })
      .map((a) => ({
        ...a,
        // reconcile availability with the registry (placeholders stay unavailable)
        available: a.available && ACTIVITY_BUILDERS[a.type].supported,
      }));
  }

  /** The activities the learner can actually do now (supported + available). */
  runnable(mission: Mission): MissionActivity[] {
    return this.order(mission).filter((a) => a.available);
  }
}
