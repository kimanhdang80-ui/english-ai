# packages/ui — Design system (reserved)

> Reserved placeholder (future `@english-ai/ui`). Today the components live in the
> root app's `src/components` (`ui/button`, `ui/input`, theme provider/toggle).

## Intended contents

- shadcn/ui **primitives** and design **tokens** implementing
  [UI_GUIDELINE.md](../../docs/UI_GUIDELINE.md).
- **Domain components** (LessonCard, FlashCard, ChatBubble, SkillProgressRing, …).
- Storybook + accessibility checks.

## Rule

Consumes `shared`; consumed by apps. No business logic, no data fetching — presentation
and interaction only.
